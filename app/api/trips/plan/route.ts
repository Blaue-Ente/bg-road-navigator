import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchNvidiaTripPlan } from "@/lib/api-clients/nvidia";
import { buildTripPlan } from "@/lib/utils/trip-stop-planner";
import type { Route } from "@/types/route.types";

const GeoPointSchema = z.object({
  lng: z.number().finite().min(-25).max(45),
  lat: z.number().finite().min(34).max(72),
});

const RouteSchema = z.object({
  id: z.string().min(1),
  origin: z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    coords: GeoPointSchema,
  }),
  destination: z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    coords: GeoPointSchema,
  }),
  waypoints: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      coords: GeoPointSchema,
    })
  ),
  distance_km: z.number().finite().positive().max(20_000),
  duration_min: z.number().finite().positive().max(30_000),
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z
      .array(z.tuple([z.number(), z.number()]))
      .min(2)
      .max(20_000),
  }),
  alternatives: z.array(z.unknown()),
  routing_source: z.enum(["osrm", "estimate"]).optional(),
  corridor_id: z.string().optional(),
});

const PlanRequestSchema = z.object({
  route: RouteSchema,
  preferences: z.object({
    vehicle_type: z.enum(["car", "ev", "truck", "motorcycle"]),
    fuel_range_km: z.number().int().min(100).max(2_000).optional(),
    ev_range_km: z.number().int().min(80).max(1_500).optional(),
    break_every_min: z.number().int().min(120).max(360).optional(),
    overnight_after_min: z.number().int().min(480).max(900).optional(),
  }),
  /** Prefer NVIDIA when configured; always falls back to heuristic. */
  prefer_ai: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = PlanRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid trip plan request", code: "INVALID_TRIP_PLAN" },
        { status: 400 }
      );
    }

    const route = parsed.data.route as Route;
    const preferences = parsed.data.preferences;

    if (parsed.data.prefer_ai) {
      const aiPlan = await fetchNvidiaTripPlan(route, preferences);
      if (aiPlan) return NextResponse.json(aiPlan);
    }

    return NextResponse.json(buildTripPlan(route, preferences));
  } catch (error) {
    console.error("Trip plan API error:", error);
    return NextResponse.json(
      { error: "Unable to build trip plan", code: "TRIP_PLAN_FAILED" },
      { status: 500 }
    );
  }
}
