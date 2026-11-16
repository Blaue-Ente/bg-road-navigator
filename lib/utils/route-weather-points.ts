import type { Route } from "@/types/route.types";
import { haversineKm } from "@/lib/geo/haversine";
import { sampleRouteCoordinates } from "@/lib/utils/route-fuel-sample";
import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";

export { nearbyPassNames } from "@/lib/i18n/locales/weather-mountain-passes";

export interface WeatherSamplePoint {
  lng: number;
  lat: number;
  distance_from_origin_km: number;
  eta_min: number;
  label: string;
}

export function sampleWeatherPoints(
  route: Route,
  count = 6,
  locale: Locale = "bg"
): WeatherSamplePoint[] {
  const coords = (route.geometry?.coordinates ?? []) as [number, number][];
  const along = catalog(locale).planner.weather.alongRouteSample;
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
          : along;
    return {
      lng: point.lng,
      lat: point.lat,
      distance_from_origin_km: Math.round(acc),
      eta_min: Math.round(frac * route.duration_min),
      label,
    };
  });
}