/**
 * Sample points along a route geometry for nearby POI lookups.
 */

import type { GeoPoint } from "@/types/route.types";
import { haversineKm } from "@/lib/geo/haversine";

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
