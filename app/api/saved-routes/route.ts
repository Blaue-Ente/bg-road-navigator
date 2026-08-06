import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthedSupabase } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureProfileRow } from "@/lib/supabase/ensure-profile";

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
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ routes: [], configured: false });
  }

  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("saved_routes")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Saved routes list error:", error);
    return NextResponse.json(
      { error: "Unable to load saved routes", code: "SAVED_ROUTES_LOAD_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ routes: data ?? [], configured: true });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const parsed = SaveRouteSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid saved route", code: "INVALID_SAVED_ROUTE" },
      { status: 400 }
    );
  }

  await ensureProfileRow(auth.supabase, auth.user.id, auth.user.email);

  const name =
    parsed.data.name?.trim() ||
    `${parsed.data.origin_label} → ${parsed.data.destination_label}`;

  const { data, error } = await auth.supabase
    .from("saved_routes")
    .insert({
      user_id: auth.user.id,
      name,
      origin_label: parsed.data.origin_label,
      origin_coords: parsed.data.origin_coords,
      destination_label: parsed.data.destination_label,
      destination_coords: parsed.data.destination_coords,
      waypoints: parsed.data.waypoints,
      route_geojson: parsed.data.route_geojson ?? null,
      distance_km: parsed.data.distance_km ?? null,
      duration_min: parsed.data.duration_min ?? null,
      vehicle_type: parsed.data.vehicle_type,
    })
    .select()
    .single();

  if (error) {
    console.error("Saved route create error:", error);
    return NextResponse.json(
      { error: "Unable to save route", code: "SAVED_ROUTE_CREATE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ route: data }, { status: 201 });
}
