/**
 * Route planning utilities for pan-European long-haul trips
 */

import { getCityById, type EuropeanCity } from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import type { Route, RouteWaypoint } from "@/types/route.types";

const ROAD_FACTOR = 1.28;
const AVG_SPEED_KMH = 85;

export function haversineKm(
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

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return mins > 0 ? `~${hours} ч ${mins} мин` : `~${hours} ч`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `~${days} д`;
  return `~${days} д ${remainingHours} ч`;
}

export function isLongHaul(minutes: number): boolean {
  return minutes >= 12 * 60;
}

export function estimateRestStops(durationMin: number): number {
  return Math.max(0, Math.floor(durationMin / 240) - 1);
}

export function calculateRouteFromCities(
  cityIds: string[],
  corridorHours?: number
): Route | null {
  const cities = cityIds
    .map((id) => getCityById(id))
    .filter((c): c is EuropeanCity => Boolean(c));

  if (cities.length < 2) return null;

  let straightDistance = 0;
  const coordinates: [number, number][] = [];
  const waypoints: RouteWaypoint[] = [];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i]!;
    coordinates.push([city.coords.lng, city.coords.lat]);
    if (i > 0 && i < cities.length - 1) {
      waypoints.push({
        id: city.id,
        label: city.label,
        coords: city.coords,
      });
    }
    if (i > 0) {
      straightDistance += haversineKm(cities[i - 1]!.coords, city.coords);
    }
  }

  const roadDistance = straightDistance * ROAD_FACTOR;
  const duration = corridorHours
    ? corridorHours * 60
    : Math.round((roadDistance / AVG_SPEED_KMH) * 60);

  const origin = cities[0]!;
  const destination = cities[cities.length - 1]!;

  return {
    id: `route-${Date.now()}`,
    origin: {
      id: origin.id,
      label: origin.label,
      coords: origin.coords,
    },
    destination: {
      id: destination.id,
      label: destination.label,
      coords: destination.coords,
    },
    waypoints,
    distance_km: Math.round(roadDistance),
    duration_min: duration,
    geometry: {
      type: "LineString",
      coordinates,
    },
    alternatives: [],
  };
}

export function calculateRouteFromLabels(
  originLabel: string,
  destLabel: string,
  allCities: EuropeanCity[]
): Route | null {
  const origin = allCities.find((c) => c.label === originLabel);
  const dest = allCities.find((c) => c.label === destLabel);
  if (!origin || !dest) return null;
  return calculateRouteFromCities([origin.id, dest.id]);
}

export function getCorridorById(id: string) {
  return TRAVEL_CORRIDORS.find((c) => c.id === id);
}

export function buildCorridorRoute(corridorId: string): Route | null {
  const corridor = getCorridorById(corridorId);
  if (!corridor) return null;
  return calculateRouteFromCities(corridor.cityIds, corridor.estimatedHours);
}
