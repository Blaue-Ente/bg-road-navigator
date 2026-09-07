/**
 * Route building — shared between API and client fallback
 */

import { getCityById } from "@/lib/constants/european-cities";
import { haversineKm } from "@/lib/geo/haversine";
import { getCorridorById } from "@/lib/utils/route-planner";
import type {
  Route,
  RouteAlternative,
  RouteManeuver,
  RoutePoint,
  RouteWaypoint,
} from "@/types/route.types";

const ROAD_FACTOR = 1.28;
const AVG_SPEED_KMH = 85;

export type RoutingSource = "osrm" | "estimate";

export interface RouteBuildInput {
  points: RoutePoint[];
  corridorId?: string;
}

export interface RouteMetrics {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  routing_source: RoutingSource;
  alternatives?: RouteAlternative[];
  maneuvers?: RouteManeuver[];
}

function estimateMetrics(
  points: RoutePoint[]
): Omit<RouteMetrics, "routing_source"> {
  let straightDistance = 0;
  const coordinates: [number, number][] = points.map((point) => [
    point.coords.lng,
    point.coords.lat,
  ]);

  for (let i = 1; i < points.length; i++) {
    straightDistance += haversineKm(points[i - 1]!.coords, points[i]!.coords);
  }

  const roadDistance = straightDistance * ROAD_FACTOR;

  return {
    distance_km: Math.round(roadDistance),
    duration_min: Math.round((roadDistance / AVG_SPEED_KMH) * 60),
    geometry: { type: "LineString", coordinates },
  };
}

export function buildEstimatedRoute(
  input: RouteBuildInput,
  overrides?: Partial<RouteMetrics>
): Route & { routing_source: RoutingSource; corridor_id?: string } {
  const { points, corridorId } = input;
  const corridor = corridorId ? getCorridorById(corridorId) : undefined;
  const estimated = estimateMetrics(points);

  const distance_km = overrides?.distance_km ?? estimated.distance_km;
  let duration_min = overrides?.duration_min ?? estimated.duration_min;

  if (!overrides?.duration_min && corridor?.estimatedHours) {
    duration_min = corridor.estimatedHours * 60;
  }

  const geometry = overrides?.geometry ?? estimated.geometry;
  const routing_source = overrides?.routing_source ?? "estimate";

  const waypoints: RouteWaypoint[] = points.slice(1, -1).map((city) => ({
    id: city.id,
    label: city.label,
    coords: city.coords,
  }));

  const origin = points[0]!;
  const destination = points[points.length - 1]!;

  const alternatives: RouteAlternative[] = (overrides?.alternatives ?? []).map(
    (alt, index) => ({
      ...alt,
      id: alt.id || `alt-${Date.now()}-${index}`,
    })
  );

  return {
    id: `route-${Date.now()}`,
    origin: { id: origin.id, label: origin.label, coords: origin.coords },
    destination: {
      id: destination.id,
      label: destination.label,
      coords: destination.coords,
    },
    waypoints,
    distance_km,
    duration_min,
    geometry,
    alternatives,
    routing_source,
    corridor_id: corridorId,
    maneuvers: overrides?.maneuvers ?? [],
  };
}

export function resolveRoutePointsFromCityIds(cityIds: string[]): RoutePoint[] {
  return cityIds
    .map((id) => getCityById(id))
    .filter((city): city is NonNullable<typeof city> => Boolean(city))
    .map((city) => ({
      id: city.id,
      label: city.label,
      subtitle: city.country,
      coords: city.coords,
      source: "curated" as const,
    }));
}
