import { EUROPEAN_CITIES } from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { haversineKm } from "@/lib/geo/haversine";

/** City-to-city chords are straight. Motorways bend, so the buffer is wide. */
export const CORRIDOR_BUFFER_KM = 45;

export type CorridorLine = Array<[number, number]>;

export function corridorPolylines(): CorridorLine[] {
  const byId = new Map(EUROPEAN_CITIES.map((city) => [city.id, city]));
  const lines: CorridorLine[] = [];
  for (const corridor of TRAVEL_CORRIDORS) {
    const line: CorridorLine = [];
    for (const id of corridor.cityIds) {
      const city = byId.get(id);
      if (city) line.push([city.coords.lng, city.coords.lat]);
    }
    if (line.length >= 2) lines.push(line);
  }
  return lines;
}

export function withinCorridor(
  lng: number,
  lat: number,
  lines: CorridorLine[],
  bufferKm = CORRIDOR_BUFFER_KM
): boolean {
  const point = { lng, lat };
  for (const line of lines) {
    for (let index = 1; index < line.length; index += 1) {
      const start = line[index - 1]!;
      const end = line[index]!;
      if (!segmentMayHit(start, end, lng, lat, bufferKm)) continue;
      const closest = closestOnSegment(
        { lng: start[0], lat: start[1] },
        { lng: end[0], lat: end[1] },
        point
      );
      if (haversineKm(point, closest) <= bufferKm) return true;
    }
  }
  return false;
}

function segmentMayHit(
  start: [number, number],
  end: [number, number],
  lng: number,
  lat: number,
  bufferKm: number
): boolean {
  const pad = bufferKm / 80;
  const west = Math.min(start[0], end[0]) - pad;
  const east = Math.max(start[0], end[0]) + pad;
  const south = Math.min(start[1], end[1]) - pad;
  const north = Math.max(start[1], end[1]) + pad;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

function closestOnSegment(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
  p: { lng: number; lat: number }
): { lng: number; lat: number } {
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
    lng: a.lng + (b.lng - a.lng) * t,
    lat: a.lat + (b.lat - a.lat) * t,
  };
}
