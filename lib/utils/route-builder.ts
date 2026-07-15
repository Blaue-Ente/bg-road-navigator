/**
 * Route building — shared between API and client fallback
 */

import { getCityById, type EuropeanCity } from "@/lib/constants/european-cities";
import { getCorridorById } from "@/lib/utils/route-planner";
import type { Route, RouteWaypoint } from "@/types/route.types";

const ROAD_FACTOR = 1.28;
const AVG_SPEED_KMH = 85;

export type RoutingSource = "osrm" | "estimate";

export interface RouteBuildInput {
  cities: EuropeanCity[];
  corridorId?: string;
}

export interface RouteMetrics {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  routing_source: RoutingSource;
}

function haversineKm(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function estimateMetrics(cities: EuropeanCity[]): Omit<RouteMetrics, "routing_source"> {
  let straightDistance = 0;
  const coordinates: [number, number][] = cities.map((c) => [
    c.coords.lng,
    c.coords.lat,
  ]);

  for (let i = 1; i < cities.length; i++) {
    straightDistance += haversineKm(cities[i - 1]!.coords, cities[i]!.coords);
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
  const { cities, corridorId } = input;
  const corridor = corridorId ? getCorridorById(corridorId) : undefined;
  const estimated = estimateMetrics(cities);

  const distance_km = overrides?.distance_km ?? estimated.distance_km;
  let duration_min = overrides?.duration_min ?? estimated.duration_min;

  if (!overrides?.duration_min && corridor?.estimatedHours) {
    duration_min = corridor.estimatedHours * 60;
  }

  const geometry = overrides?.geometry ?? estimated.geometry;
  const routing_source = overrides?.routing_source ?? "estimate";

  const waypoints: RouteWaypoint[] = cities
    .slice(1, -1)
    .map((city) => ({
      id: city.id,
      label: city.label,
      coords: city.coords,
    }));

  const origin = cities[0]!;
  const destination = cities[cities.length - 1]!;

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
    alternatives: [],
    routing_source,
    corridor_id: corridorId,
  };
}

export function resolveCitiesFromIds(cityIds: string[]): EuropeanCity[] {
  return cityIds
    .map((id) => getCityById(id))
    .filter((c): c is EuropeanCity => Boolean(c));
}
