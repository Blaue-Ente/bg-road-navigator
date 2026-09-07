import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchOsrmRoute } from "@/lib/api-clients/osrm";
import { getCorridorById } from "@/lib/utils/route-planner";
import {
  buildEstimatedRoute,
  resolveRoutePointsFromCityIds,
} from "@/lib/utils/route-builder";
import type { RoutePoint } from "@/types/route.types";

const EuropePointSchema = z.object({
  id: z.string().min(1).max(240),
  label: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(240).optional(),
  coords: z.object({
    lng: z.number().finite().min(-25).max(45),
    lat: z.number().finite().min(34).max(72),
  }),
  source: z.enum(["curated", "geocoder", "user"]),
});

const RouteBodySchema = z.object({
  city_ids: z.array(z.string().min(1).max(80)).min(2).max(12).optional(),
  corridor_id: z.string().max(80).optional(),
  origin_id: z.string().max(80).optional(),
  destination_id: z.string().max(80).optional(),
  points: z.array(EuropePointSchema).min(2).max(12).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RouteBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", code: "INVALID_BODY" },
        { status: 400 }
      );
    }

    let points: RoutePoint[] | undefined;

    if (parsed.data.corridor_id) {
      const corridor = getCorridorById(parsed.data.corridor_id);
      if (!corridor) {
        return NextResponse.json(
          { error: "Corridor not found", code: "CORRIDOR_NOT_FOUND" },
          { status: 404 }
        );
      }
      points = resolveRoutePointsFromCityIds(corridor.cityIds);
    } else if (parsed.data.points) {
      points = parsed.data.points;
    } else if (parsed.data.origin_id && parsed.data.destination_id) {
      points = resolveRoutePointsFromCityIds([
        parsed.data.origin_id,
        parsed.data.destination_id,
      ]);
    } else if (parsed.data.city_ids) {
      points = resolveRoutePointsFromCityIds(parsed.data.city_ids);
    }

    if (!points || points.length < 2) {
      return NextResponse.json(
        {
          error: "At least two valid points required",
          code: "INSUFFICIENT_POINTS",
        },
        { status: 400 }
      );
    }

    const coords = points.map((point) => point.coords);
    const osrm = await fetchOsrmRoute(coords);

    const input = {
      points,
      corridorId: parsed.data.corridor_id,
    };

    if (osrm) {
      const route = buildEstimatedRoute(input, {
        distance_km: osrm.distance_km,
        duration_min: osrm.duration_min,
        geometry: osrm.geometry,
        routing_source: "osrm",
        alternatives: osrm.alternatives.map((alt, index) => ({
          id: `osrm-alt-${index}`,
          distance_km: alt.distance_km,
          duration_min: alt.duration_min,
          geometry: alt.geometry,
          weight: alt.weight,
          maneuvers: alt.maneuvers,
        })),
        maneuvers: osrm.maneuvers,
      });
      return NextResponse.json(route);
    }

    const route = buildEstimatedRoute(input, { routing_source: "estimate" });
    return NextResponse.json(route);
  } catch (error) {
    console.error("Route API error:", error);
    return NextResponse.json(
      { error: "Failed to calculate route", code: "ROUTE_FAILED" },
      { status: 500 }
    );
  }
}
