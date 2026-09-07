import type { Route } from "@/types/route.types";
import { haversineKm } from "@/lib/geo/haversine";
import { sampleRouteCoordinates } from "@/lib/utils/route-fuel-sample";

export interface WeatherSamplePoint {
  lng: number;
  lat: number;
  distance_from_origin_km: number;
  eta_min: number;
  label: string;
}

const PASSES = [
  { name: "Шипченски проход", lng: 25.323, lat: 42.748 },
  { name: "Предела", lng: 23.407, lat: 41.897 },
  { name: "Петрохан", lng: 23.125, lat: 43.118 },
  { name: "Троянски проход", lng: 24.676, lat: 42.778 },
] as const;

export function sampleWeatherPoints(
  route: Route,
  count = 6
): WeatherSamplePoint[] {
  const coords = (route.geometry?.coordinates ?? []) as [number, number][];
  const samples =
    coords.length >= 2
      ? sampleRouteCoordinates(coords, 80, count)
      : [
          route.origin.coords,
          ...route.waypoints.map((w) => w.coords),
          route.destination.coords,
        ];

  let acc = 0;
  return samples.map((point, index) => {
    if (index > 0) acc += haversineKm(samples[index - 1]!, point);
    const frac =
      route.distance_km > 0 ? Math.min(1, acc / route.distance_km) : 0;
    const label =
      index === 0
        ? route.origin.label
        : index === samples.length - 1
          ? route.destination.label
          : "По маршрута";
    return {
      lng: point.lng,
      lat: point.lat,
      distance_from_origin_km: Math.round(acc),
      eta_min: Math.round(frac * route.duration_min),
      label,
    };
  });
}

export function nearbyPassNames(
  points: Array<{ lng: number; lat: number }>,
  radiusKm = 35
): string[] {
  const names: string[] = [];
  for (const pass of PASSES) {
    if (points.some((p) => haversineKm(p, pass) <= radiusKm)) {
      names.push(pass.name);
    }
  }
  return names;
}
