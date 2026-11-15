import type { ThroughPoint } from "@/lib/planner/via-route";
import type { GeoPoint } from "@/types/route.types";

/** Progress of `point` along the straight origin → destination chord, 0–1. */
function chordProgress(origin: GeoPoint, destination: GeoPoint, point: GeoPoint): number {
  const dx = destination.lng - origin.lng;
  const dy = destination.lat - origin.lat;
  const len = dx * dx + dy * dy;
  if (len === 0) return 0;
  const t = ((point.lng - origin.lng) * dx + (point.lat - origin.lat) * dy) / len;
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

/**
 * Origin, optional user vias, optional border, destination.
 * With no vias the border leg matches the previous three-point chain.
 */
export function routeThroughPoints(
  origin: GeoPoint,
  via: GeoPoint[],
  destination: GeoPoint,
  border?: GeoPoint
): ThroughPoint[] {
  const extras = [
    ...via.map((point) => ({ point, role: "through" as const })),
    ...(border ? [{ point: border, role: "through" as const }] : []),
  ].sort(
    (a, b) =>
      chordProgress(origin, destination, a.point) -
      chordProgress(origin, destination, b.point)
  );
  return [
    { lng: origin.lng, lat: origin.lat, role: "break" },
    ...extras.map((item) => ({
      lng: item.point.lng,
      lat: item.point.lat,
      role: item.role,
    })),
    { lng: destination.lng, lat: destination.lat, role: "break" },
  ];
}
