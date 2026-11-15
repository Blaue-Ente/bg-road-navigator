import { haversineKm } from "@/lib/geo/haversine";
import type {
  AccidentKind,
  AccidentPoint,
  Hotspot,
} from "@/lib/hotspots/types";

/** About 400 m. Points farther apart stay in different clusters. */
export const HOTSPOT_RADIUS_KM = 0.4;
/** Injury and fatal accidents required before a place becomes a hotspot. */
export const HOTSPOT_MIN_COUNT = 3;

const WEIGHT: Record<AccidentKind, number> = {
  fatal: 3,
  serious: 2,
  slight: 1,
};

/**
 * Grid is wider than the radius in both axes at corridor latitudes,
 * so a pair inside the radius always shares a cell or a neighbour.
 */
const CELL_DEG = 0.008;

export function accidentWeight(kind: AccidentKind): number {
  return WEIGHT[kind];
}

export function clusterAccidents(
  points: AccidentPoint[],
  radiusKm = HOTSPOT_RADIUS_KM,
  minCount = HOTSPOT_MIN_COUNT
): Hotspot[] {
  const groups = new Map<string, AccidentPoint[]>();
  for (const point of points) {
    if (!Number.isFinite(point.lng) || !Number.isFinite(point.lat)) continue;
    const key = `${point.source_id}|${point.country}`;
    const list = groups.get(key);
    if (list) list.push(point);
    else groups.set(key, [point]);
  }

  const hotspots: Hotspot[] = [];
  for (const list of groups.values()) {
    hotspots.push(...clusterGroup(list, radiusKm, minCount));
  }
  hotspots.sort(
    (a, b) => a.lat - b.lat || a.lng - b.lng || a.id.localeCompare(b.id)
  );
  return hotspots;
}

function clusterGroup(
  points: AccidentPoint[],
  radiusKm: number,
  minCount: number
): Hotspot[] {
  const count = points.length;
  const parent = new Uint32Array(count);
  for (let index = 0; index < count; index += 1) parent[index] = index;

  const find = (index: number): number => {
    let cursor = index;
    while (parent[cursor] !== cursor) cursor = parent[cursor]!;
    let current = index;
    while (parent[current] !== cursor) {
      const next = parent[current]!;
      parent[current] = cursor;
      current = next;
    }
    return cursor;
  };

  const buckets = new Map<string, number[]>();
  for (let index = 0; index < count; index += 1) {
    const point = points[index]!;
    const key = cellKey(point.lng, point.lat);
    const list = buckets.get(key);
    if (list) list.push(index);
    else buckets.set(key, [index]);
  }

  for (let index = 0; index < count; index += 1) {
    const point = points[index]!;
    const cx = Math.floor(point.lng / CELL_DEG);
    const cy = Math.floor(point.lat / CELL_DEG);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        const neighbours = buckets.get(`${cx + dx}:${cy + dy}`);
        if (!neighbours) continue;
        for (const other of neighbours) {
          if (other <= index) continue;
          if (haversineKm(point, points[other]!) <= radiusKm) {
            const left = find(index);
            const right = find(other);
            if (left !== right) parent[right] = left;
          }
        }
      }
    }
  }

  const members = new Map<number, AccidentPoint[]>();
  for (let index = 0; index < count; index += 1) {
    const root = find(index);
    const list = members.get(root);
    if (list) list.push(points[index]!);
    else members.set(root, [points[index]!]);
  }

  const source = points[0]?.source_id ?? "hotspot";
  const country = points[0]?.country ?? "";
  const built: Hotspot[] = [];
  for (const group of members.values()) {
    if (group.length < minCount) continue;
    built.push(toHotspot(group, source, country));
  }
  built.sort((a, b) => a.lat - b.lat || a.lng - b.lng);
  return built.map((hotspot, index) => ({
    ...hotspot,
    id: `${source}-${country}-${index}`,
  }));
}

function cellKey(lng: number, lat: number): string {
  return `${Math.floor(lng / CELL_DEG)}:${Math.floor(lat / CELL_DEG)}`;
}

function toHotspot(
  group: AccidentPoint[],
  sourceId: string,
  country: string
): Hotspot {
  let lng = 0;
  let lat = 0;
  let severity = 0;
  let fatal = 0;
  let serious = 0;
  let slight = 0;
  let yearFrom = group[0]!.year;
  let yearTo = group[0]!.year;
  for (const point of group) {
    lng += point.lng;
    lat += point.lat;
    severity += accidentWeight(point.kind);
    if (point.kind === "fatal") fatal += 1;
    else if (point.kind === "serious") serious += 1;
    else slight += 1;
    if (point.year < yearFrom) yearFrom = point.year;
    if (point.year > yearTo) yearTo = point.year;
  }
  const size = group.length;
  return {
    id: sourceId,
    country,
    lng: Math.round((lng / size) * 1e5) / 1e5,
    lat: Math.round((lat / size) * 1e5) / 1e5,
    count: size,
    fatal,
    serious,
    slight,
    severity,
    year_from: yearFrom,
    year_to: yearTo,
    source_id: sourceId,
  };
}
