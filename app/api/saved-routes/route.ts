import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { ensureProfile } from "@/lib/db/profiles";
import { insertSavedRoute, listSavedRoutes } from "@/lib/db/saved";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const GeoSchema = z.object({
  lng: z.number().finite().min(-25).max(45),
  lat: z.number().finite().min(34).max(72),
});

const SaveRouteSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  origin_label: z.string().trim().min(1).max(160),
  origin_coords: GeoSchema,
  destination_label: z.string().trim().min(1).max(160),
  destination_coords: GeoSchema,
  waypoints: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().optional(),
        coords: GeoSchema,
      })
    )
    .max(20)
    .default([]),
  route_geojson: z
    .object({
      type: z.literal("LineString"),
      coordinates: z.array(z.tuple([z.number(), z.number()])).min(2),
    })
    .nullable()
    .optional(),
  distance_km: z.number().finite().positive().max(20_000).optional(),
  duration_min: z.number().finite().positive().max(30_000).optional(),
  vehicle_type: z.enum(["car", "ev", "truck", "motorcycle"]).default("car"),
});

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ routes: [], configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    const routes = await listSavedRoutes(auth.user.id);
    return NextResponse.json({ routes, configured: true });
  } catch (error) {
    const response = toDbResponse(error);
    if (response.status === 503) {
      return NextResponse.json({ routes: [], configured: false });
    }
    return response;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `route-save:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    15,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();

  const parsed = SaveRouteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Невалиден маршрут", code: "INVALID_SAVED_ROUTE" },
      { status: 400 }
    );
  }

  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const route = await insertSavedRoute({
      userId: auth.user.id,
      name:
        parsed.data.name?.trim() ||
        `${parsed.data.origin_label} → ${parsed.data.destination_label}`,
      originLabel: parsed.data.origin_label,
      originCoords: parsed.data.origin_coords,
      destinationLabel: parsed.data.destination_label,
      destinationCoords: parsed.data.destination_coords,
      waypoints: parsed.data.waypoints,
      routeGeojson: parsed.data.route_geojson ?? null,
      distanceKm: parsed.data.distance_km ?? null,
      durationMin: parsed.data.duration_min
        ? Math.round(parsed.data.duration_min)
        : null,
      vehicleType: parsed.data.vehicle_type,
    });
    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    return toDbResponse(error);
  }
}
