import { haversineKm } from "@/lib/geo/haversine";
import type { GeoPoint } from "@/types/route.types";

export function toPoint(coord: [number, number]): GeoPoint {
  return { lng: coord[0], lat: coord[1] };
}

export function lineLengthKm(coordinates: Array<[number, number]>): number {
  let total = 0;
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineKm(
      toPoint(coordinates[i - 1]!),
      toPoint(coordinates[i]!)
    );
  }
  return total;
}

/** Point and distance along a polyline. `targetKm` is clamped to the line. */
export function pointAtDistance(
  coordinates: Array<[number, number]>,
  targetKm: number
): GeoPoint {
  if (coordinates.length === 0) return { lng: 0, lat: 0 };
  const first = toPoint(coordinates[0]!);
  if (coordinates.length === 1 || targetKm <= 0) return first;

  let travelled = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const previous = toPoint(coordinates[i - 1]!);
    const current = toPoint(coordinates[i]!);
    const segment = haversineKm(previous, current);
    if (travelled + segment >= targetKm || i === coordinates.length - 1) {
      const ratio =
        segment === 0 ? 0 : Math.min(1, (targetKm - travelled) / segment);
      return {
        lng: previous.lng + (current.lng - previous.lng) * ratio,
        lat: previous.lat + (current.lat - previous.lat) * ratio,
      };
    }
    travelled += segment;
  }
  return toPoint(coordinates[coordinates.length - 1]!);
}

function projectOntoSegment(
  a: GeoPoint,
  b: GeoPoint,
  p: GeoPoint
): { point: GeoPoint; t: number } {
  const lat0 = (((a.lat + b.lat) / 2) * Math.PI) / 180;
  const kx = Math.cos(lat0);
  const ax = a.lng * kx;
  const ay = a.lat;
  const bx = b.lng * kx;
  const by = b.lat;
  const px = p.lng * kx;
  const py = p.lat;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const raw = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  const t = Math.min(1, Math.max(0, raw));
  return {
    t,
    point: {
      lng: a.lng + (b.lng - a.lng) * t,
      lat: a.lat + (b.lat - a.lat) * t,
    },
  };
}

/** Closest approach of a point to a polyline, plus distance from the start. */
export function distanceToPolylineKm(
  coordinates: Array<[number, number]>,
  point: GeoPoint
): { distanceKm: number; alongKm: number } {
  if (coordinates.length === 0) return { distanceKm: Infinity, alongKm: 0 };
  if (coordinates.length === 1) {
    return {
      distanceKm: haversineKm(toPoint(coordinates[0]!), point),
      alongKm: 0,
    };
  }

  let best = Infinity;
  let alongKm = 0;
  let travelled = 0;
  const step =
    coordinates.length > 800 ? Math.ceil(coordinates.length / 800) : 1;

  for (let i = step; i < coordinates.length; i += step) {
    const previous = toPoint(coordinates[i - step]!);
    const current = toPoint(coordinates[i]!);
    const segmentKm = haversineKm(previous, current);
    const projected = projectOntoSegment(previous, current, point);
    const distanceKm = haversineKm(projected.point, point);
    if (distanceKm < best) {
      best = distanceKm;
      alongKm = travelled + segmentKm * projected.t;
    }
    travelled += segmentKm;
  }

  const last = toPoint(coordinates[coordinates.length - 1]!);
  const tail = haversineKm(last, point);
  if (tail < best) {
    best = tail;
    alongKm = travelled;
  }

  return { distanceKm: best, alongKm };
}

/**
 * How far `point` sits from the straight origin→destination segment.
 * `t` is 0 at the origin and 1 at the destination (sampled, not geodesic).
 */
export function distanceToSegmentKm(
  origin: GeoPoint,
  destination: GeoPoint,
  point: GeoPoint
): { distanceKm: number; t: number } {
  const total = haversineKm(origin, destination);
  if (total < 1) {
    return { distanceKm: haversineKm(origin, point), t: 0 };
  }
  const steps = Math.max(12, Math.ceil(total / 20));
  let best = Infinity;
  let bestT = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sample = {
      lng: origin.lng + (destination.lng - origin.lng) * t,
      lat: origin.lat + (destination.lat - origin.lat) * t,
    };
    const distanceKm = haversineKm(sample, point);
    if (distanceKm < best) {
      best = distanceKm;
      bestT = t;
    }
  }
  return { distanceKm: best, t: bestT };
}
