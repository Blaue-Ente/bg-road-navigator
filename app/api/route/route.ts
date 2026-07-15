import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchOsrmRoute } from "@/lib/api-clients/osrm";
import { getCityById } from "@/lib/constants/european-cities";
import { getCorridorById } from "@/lib/utils/route-planner";
import {
  buildEstimatedRoute,
  type RouteBuildInput,
} from "@/lib/utils/route-builder";

const RouteBodySchema = z.object({
  city_ids: z.array(z.string()).min(2).optional(),
  corridor_id: z.string().optional(),
  origin_id: z.string().optional(),
  destination_id: z.string().optional(),
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

    let cityIds = parsed.data.city_ids;

    if (parsed.data.corridor_id) {
      const corridor = getCorridorById(parsed.data.corridor_id);
      if (!corridor) {
        return NextResponse.json(
          { error: "Corridor not found", code: "CORRIDOR_NOT_FOUND" },
          { status: 404 }
        );
      }
      cityIds = corridor.cityIds;
    } else if (parsed.data.origin_id && parsed.data.destination_id) {
      cityIds = [parsed.data.origin_id, parsed.data.destination_id];
    }

    if (!cityIds || cityIds.length < 2) {
      return NextResponse.json(
        { error: "At least two cities required", code: "INSUFFICIENT_POINTS" },
        { status: 400 }
      );
    }

    const cities = cityIds
      .map((id) => getCityById(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));

    if (cities.length < 2) {
      return NextResponse.json(
        { error: "Unknown city id", code: "UNKNOWN_CITY" },
        { status: 400 }
      );
    }

    const coords = cities.map((c) => c.coords);
    const osrm = await fetchOsrmRoute(coords);

    const input: RouteBuildInput = {
      cities,
      corridorId: parsed.data.corridor_id,
    };

    if (osrm) {
      const route = buildEstimatedRoute(input, {
        distance_km: osrm.distance_km,
        duration_min: osrm.duration_min,
        geometry: osrm.geometry,
        routing_source: "osrm",
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
