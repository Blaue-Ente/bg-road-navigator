/**
 * Countries crossed by a route, in travel order.
 *
 * Public OSRM responses include a road LineString and step locations, not
 * country codes. This classifies sampled points against simplified Natural
 * Earth outlines (lib/geo/country-outlines.json) so the result stays a pure
 * function of the route we already have.
 */

import { haversineKm } from "@/lib/geo/haversine";
import outlines from "@/lib/geo/country-outlines.json";
import type { GeoPoint } from "@/types/route.types";

type Ring = number[][];

interface CountryShape {
  code: string;
  rings: Ring[];
  bbox: { minLng: number; minLat: number; maxLng: number; maxLat: number };
}

const SHAPES: CountryShape[] = Object.entries(
  outlines as Record<string, Ring[]>
).map(([code, rings]) => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  for (const ring of rings) {
    for (const point of ring) {
      const lng = point[0] ?? 0;
      const lat = point[1] ?? 0;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  return { code, rings, bbox: { minLng, minLat, maxLng, maxLat } };
});

const SHAPE_BY_CODE = new Map(SHAPES.map((shape) => [shape.code, shape]));

/** Sample spacing along the line. Short enough to catch a real transit. */
const SAMPLE_KM = 8;
/** Coastal cities can sit in a coarse shoreline gap (Istanbul / the Bosphorus). */
const COAST_PROBE_DEG = 0.045;

export interface CountryRouteInput {
  geometry?: { coordinates?: number[][] } | null;
  maneuvers?: Array<{ coords: GeoPoint }>;
  origin?: { coords: GeoPoint };
  destination?: { coords: GeoPoint };
}

interface Sample {
  lng: number;
  lat: number;
  km: number;
}

function pointInRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]?.[0] ?? 0;
    const yi = ring[i]?.[1] ?? 0;
    const xj = ring[j]?.[0] ?? 0;
    const yj = ring[j]?.[1] ?? 0;
    const crosses = yi > lat !== yj > lat;
    if (crosses && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function sqSegDist(lng: number, lat: number, a: number[], b: number[]): number {
  let x = a[0] ?? 0;
  let y = a[1] ?? 0;
  const dx = (b[0] ?? 0) - x;
  const dy = (b[1] ?? 0) - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((lng - x) * dx + (lat - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0] ?? x;
      y = b[1] ?? y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  const ox = lng - x;
  const oy = lat - y;
  return ox * ox + oy * oy;
}

function depthInside(lng: number, lat: number, shape: CountryShape): number {
  let depth = 0;
  for (const ring of shape.rings) {
    if (!pointInRing(lng, lat, ring)) continue;
    let edge = Infinity;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const dist = sqSegDist(lng, lat, ring[j] ?? [], ring[i] ?? []);
      if (dist < edge) edge = dist;
    }
    if (edge > depth) depth = edge;
  }
  return depth;
}

function countriesContaining(lng: number, lat: number): string[] {
  const hits: string[] = [];
  for (const shape of SHAPES) {
    const { minLng, minLat, maxLng, maxLat } = shape.bbox;
    if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) continue;
    if (shape.rings.some((ring) => pointInRing(lng, lat, ring))) {
      hits.push(shape.code);
    }
  }
  return hits;
}

function preferDeepest(lng: number, lat: number, codes: string[]): string {
  let best = codes[0] ?? "";
  let bestDepth = -1;
  for (const code of codes) {
    const shape = SHAPE_BY_CODE.get(code);
    if (!shape) continue;
    const depth = depthInside(lng, lat, shape);
    if (depth > bestDepth) {
      bestDepth = depth;
      best = code;
    }
  }
  return best;
}

/** ISO 3166-1 alpha-2 for a point, or null when it is not in a known outline. */
export function countryCodeAtPoint(lng: number, lat: number): string | null {
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const direct = countriesContaining(lng, lat);
  if (direct.length === 1) return direct[0] ?? null;
  if (direct.length > 1) return preferDeepest(lng, lat, direct);

  const votes = new Map<string, number>();
  for (const dLng of [-COAST_PROBE_DEG, 0, COAST_PROBE_DEG]) {
    for (const dLat of [-COAST_PROBE_DEG, 0, COAST_PROBE_DEG]) {
      if (dLng === 0 && dLat === 0) continue;
      const hits = countriesContaining(lng + dLng, lat + dLat);
      if (hits.length !== 1) continue;
      const code = hits[0]!;
      votes.set(code, (votes.get(code) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestVotes = 0;
  let secondVotes = 0;
  for (const [code, count] of votes) {
    if (count > bestVotes) {
      secondVotes = bestVotes;
      best = code;
      bestVotes = count;
    } else if (count > secondVotes) {
      secondVotes = count;
    }
  }
  // Three nearby probes, and a clear lead, covers a shoreline gap such as
  // the Bosphorus without adopting a tie between two countries.
  return bestVotes >= 3 && bestVotes > secondVotes ? best : null;
}

function sampleLine(coordinates: number[][]): Sample[] {
  const first = coordinates[0];
  if (!first || first.length < 2) return [];
  const out: Sample[] = [{ lng: first[0]!, lat: first[1]!, km: 0 }];
  let acc = 0;
  let nextMark = SAMPLE_KM;

  for (let i = 1; i < coordinates.length; i++) {
    const start = coordinates[i - 1];
    const end = coordinates[i];
    if (!start || !end || start.length < 2 || end.length < 2) continue;
    const seg = haversineKm(
      { lng: start[0]!, lat: start[1]! },
      { lng: end[0]!, lat: end[1]! }
    );
    if (seg <= 0) continue;
    while (acc + seg >= nextMark - 1e-6) {
      const t = (nextMark - acc) / seg;
      out.push({
        lng: start[0]! + (end[0]! - start[0]!) * t,
        lat: start[1]! + (end[1]! - start[1]!) * t,
        km: nextMark,
      });
      nextMark += SAMPLE_KM;
    }
    acc += seg;
  }

  const last = coordinates[coordinates.length - 1];
  if (!last || last.length < 2) return out;
  const prev = out[out.length - 1]!;
  if (
    Math.abs(prev.lng - last[0]!) > 1e-7 ||
    Math.abs(prev.lat - last[1]!) > 1e-7
  ) {
    out.push({ lng: last[0]!, lat: last[1]!, km: acc });
  } else {
    prev.km = acc;
  }
  return out;
}

function collectSamples(route: CountryRouteInput): Sample[] {
  const coordinates = route.geometry?.coordinates;
  if (coordinates && coordinates.length >= 2) return sampleLine(coordinates);

  const maneuverPoints = (route.maneuvers ?? [])
    .map((step) => step.coords)
    .filter(
      (point) => Number.isFinite(point.lng) && Number.isFinite(point.lat)
    );
  if (maneuverPoints.length >= 2) {
    return sampleLine(maneuverPoints.map((point) => [point.lng, point.lat]));
  }

  const ends = [route.origin?.coords, route.destination?.coords].filter(
    (point): point is GeoPoint =>
      Boolean(point) &&
      Number.isFinite(point!.lng) &&
      Number.isFinite(point!.lat)
  );
  if (ends.length === 0) return [];
  return sampleLine(ends.map((point) => [point.lng, point.lat]));
}

/**
 * ISO codes in the order the route enters them.
 * A single stray sample (a simplified border) is ignored unless it is an
 * endpoint, so a city at the start or finish is kept.
 */
export function countriesAlongRoute(route: CountryRouteInput): string[] {
  const samples = collectSamples(route);
  if (samples.length === 0) return [];

  const tagged = samples.map((sample) => ({
    km: sample.km,
    code: countryCodeAtPoint(sample.lng, sample.lat),
  }));

  const spans: Array<{
    code: string;
    km: number;
    samples: number;
    endpoint: boolean;
  }> = [];

  let index = 0;
  while (index < tagged.length) {
    const code = tagged[index]?.code;
    let end = index + 1;
    while (end < tagged.length && tagged[end]?.code === code) end += 1;
    if (code) {
      const startKm = tagged[index]?.km ?? 0;
      const endKm = tagged[end - 1]?.km ?? startKm;
      spans.push({
        code,
        km: endKm - startKm,
        samples: end - index,
        endpoint: index === 0 || end === tagged.length,
      });
    }
    index = end;
  }

  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const span of spans) {
    const keep = span.samples >= 2 || span.km >= SAMPLE_KM || span.endpoint;
    if (!keep || seen.has(span.code)) continue;
    seen.add(span.code);
    ordered.push(span.code);
  }
  return ordered;
}
