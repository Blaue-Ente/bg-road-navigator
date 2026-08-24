/**
 * Sample points along a route geometry for nearby POI lookups.
 */

import type { GeoPoint } from "@/types/route.types";

function haversineKm(a: GeoPoint, b: GeoPoint): number {
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

export function bboxFromCoordinates(
  coordinates: Array<[number, number]>
): { w: number; s: number; e: number; n: number } | null {
  if (coordinates.length === 0) return null;
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const [lng, lat] of coordinates) {
    w = Math.min(w, lng);
    s = Math.min(s, lat);
    e = Math.max(e, lng);
    n = Math.max(n, lat);
  }
  return { w, s, e, n };
}

/**
 * Walk the line and emit a sample roughly every `everyKm` kilometres
 * (plus start/end). Caps total samples for API cost control.
 */
export function sampleRouteCoordinates(
  coordinates: Array<[number, number]>,
  everyKm = 80,
  maxSamples = 8
): GeoPoint[] {
  if (coordinates.length === 0) return [];
  if (coordinates.length === 1) {
    return [{ lng: coordinates[0]![0], lat: coordinates[0]![1] }];
  }

  const samples: GeoPoint[] = [
    { lng: coordinates[0]![0], lat: coordinates[0]![1] },
  ];
  let travelled = 0;
  let nextAt = everyKm;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = {
      lng: coordinates[i - 1]![0],
      lat: coordinates[i - 1]![1],
    };
    const curr = {
      lng: coordinates[i]![0],
      lat: coordinates[i]![1],
    };
    const seg = haversineKm(prev, curr);
    while (travelled + seg >= nextAt && samples.length < maxSamples - 1) {
      const need = nextAt - travelled;
      const ratio = seg === 0 ? 0 : need / seg;
      samples.push({
        lng: prev.lng + (curr.lng - prev.lng) * ratio,
        lat: prev.lat + (curr.lat - prev.lat) * ratio,
      });
      nextAt += everyKm;
    }
    travelled += seg;
  }

  const end = {
    lng: coordinates[coordinates.length - 1]![0],
    lat: coordinates[coordinates.length - 1]![1],
  };
  const last = samples[samples.length - 1]!;
  if (haversineKm(last, end) > 5 || samples.length === 1) {
    if (samples.length < maxSamples) samples.push(end);
    else samples[samples.length - 1] = end;
  }

  return samples;
}

/** Major BG cities used when a country-sized bbox would otherwise hit empty countryside. */
export const BULGARIA_FUEL_CENTERS: GeoPoint[] = [
  { lng: 23.3219, lat: 42.6977 },
  { lng: 24.7453, lat: 42.1354 },
  { lng: 27.9147, lat: 43.2141 },
  { lng: 27.4626, lat: 42.5048 },
  { lng: 25.9546, lat: 43.8486 },
];

export function isWideFuelBbox(bbox: {
  w: number;
  s: number;
  e: number;
  n: number;
}): boolean {
  return bbox.e - bbox.w >= 3 || bbox.n - bbox.s >= 2;
}

export function fuelLookupPointsForBbox(bbox: {
  w: number;
  s: number;
  e: number;
  n: number;
}): GeoPoint[] {
  const center = {
    lng: (bbox.w + bbox.e) / 2,
    lat: (bbox.s + bbox.n) / 2,
  };
  if (!isWideFuelBbox(bbox)) return [center];

  const cities = BULGARIA_FUEL_CENTERS.filter(
    (point) =>
      point.lng >= bbox.w &&
      point.lng <= bbox.e &&
      point.lat >= bbox.s &&
      point.lat <= bbox.n
  );
  return cities.length > 0 ? cities : [center];
}
