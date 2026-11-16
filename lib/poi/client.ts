import { ociFetch } from "@/lib/api-clients/oci-geo";
import { isInEurope } from "@/lib/geo/bounds";
import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";
import type { PoiConfig } from "@/lib/poi/config";
import {
  CONTRACT_POI_TYPES,
  type PoiCollection,
  type PoiItem,
  type PoiType,
} from "@/lib/poi/types";

const POI_TIMEOUT_MS = 8_000;

export interface CorridorQuery {
  polyline: Array<[number, number]>;
  bufferM: number;
  types: PoiType[];
  limit: number;
}

export async function fetchPoiCorridor(
  config: PoiConfig,
  query: CorridorQuery,
  fetchImpl?: typeof fetch
): Promise<PoiCollection | null> {
  const types = unique(query.types);
  const first = await postCorridor(config, query, types, fetchImpl);
  if (first !== "retry") return first;
  return postCorridor(config, query, [...CONTRACT_POI_TYPES], fetchImpl).then(
    (result) => (result === "retry" ? null : result)
  );
}

export async function fetchPoiNear(
  config: PoiConfig,
  input: {
    lat: number;
    lon: number;
    radiusM: number;
    types: PoiType[];
    limit: number;
  }
): Promise<PoiCollection | null> {
  const params = new URLSearchParams({
    lat: String(input.lat),
    lon: String(input.lon),
    radius_m: String(input.radiusM),
    types: unique(input.types).join(","),
    limit: String(input.limit),
  });
  try {
    const response = await ociFetch(
      `${config.baseUrl}/near?${params}`,
      config.apiKey,
      { method: "GET" },
      POI_TIMEOUT_MS
    );
    if (!response.ok) return null;
    return parsePoiCollection(await response.json());
  } catch {
    return null;
  }
}

export async function fetchPoiHealth(
  config: PoiConfig
): Promise<"ok" | "down"> {
  try {
    const response = await ociFetch(
      `${config.baseUrl}/health`,
      config.apiKey,
      { method: "GET" },
      4_000
    );
    return response.ok ? "ok" : "down";
  } catch {
    return "down";
  }
}

export function parsePoiCollection(payload: unknown): PoiCollection | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as {
    items?: unknown;
    source?: unknown;
    osm_timestamp?: unknown;
  };
  if (!Array.isArray(record.items)) return null;
  const items: PoiItem[] = [];
  for (const raw of record.items) {
    const item = parseItem(raw);
    if (item) items.push(item);
  }
  return {
    items,
    source: typeof record.source === "string" ? record.source : "poi",
    osm_timestamp:
      typeof record.osm_timestamp === "string" ? record.osm_timestamp : null,
  };
}

export function toPoiPolyline(
  line: Array<[number, number]>,
  maxPoints = 80
): Array<[number, number]> {
  if (line.length === 0) return [];
  const indexes =
    line.length <= maxPoints
      ? line.map((_, index) => index)
      : Array.from({ length: maxPoints }, (_, index) =>
          Math.round((index * (line.length - 1)) / (maxPoints - 1))
        );
  const seen = new Set<number>();
  const points: Array<[number, number]> = [];
  for (const index of indexes) {
    if (seen.has(index)) continue;
    seen.add(index);
    const [lng, lat] = line[index]!;
    points.push([round5(lat), round5(lng)]);
  }
  return points;
}

async function postCorridor(
  config: PoiConfig,
  query: CorridorQuery,
  types: PoiType[],
  fetchImpl?: typeof fetch
): Promise<PoiCollection | null | "retry"> {
  const previous = fetchImpl ? globalThis.fetch : null;
  if (fetchImpl) globalThis.fetch = fetchImpl;
  try {
    const response = await ociFetch(
      `${config.baseUrl}/corridor`,
      config.apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polyline: query.polyline,
          buffer_m: query.bufferM,
          types,
          limit: query.limit,
        }),
      },
      POI_TIMEOUT_MS
    );
    if (response.status === 400 && hasExtraType(types)) {
      return "retry";
    }
    if (!response.ok) return null;
    return parsePoiCollection(await response.json());
  } catch {
    return null;
  } finally {
    if (previous) globalThis.fetch = previous;
  }
}

function parseItem(raw: unknown): PoiItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<PoiItem> & { lon?: unknown; lat?: unknown };
  const lat = typeof item.lat === "number" ? item.lat : Number.NaN;
  const lon = typeof item.lon === "number" ? item.lon : Number.NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (!isInEurope(lon, lat)) return null;
  const type = item.type;
  if (!isPoiType(type)) return null;
  const id = typeof item.id === "string" && item.id.trim() ? item.id : "";
  if (!id) return null;
  const tags =
    item.tags && typeof item.tags === "object"
      ? Object.fromEntries(
          Object.entries(item.tags).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string"
          )
        )
      : {};
  return {
    id,
    type,
    name: typeof item.name === "string" && item.name.trim() ? item.name.trim() : fallbackName(type),
    brand: textOrNull(item.brand),
    operator: textOrNull(item.operator),
    lat,
    lon,
    tags,
    dist_m: finiteOrNull(item.dist_m),
    along_m: finiteOrNull(item.along_m),
  };
}

function isPoiType(value: unknown): value is PoiType {
  return (
    value === "fuel" ||
    value === "charging" ||
    value === "hotel" ||
    value === "restaurant" ||
    value === "rest_area" ||
    value === "toilets" ||
    value === "attraction" ||
    value === "viewpoint" ||
    value === "playground"
  );
}

export function poiFallbackName(
  type: PoiType,
  locale: Locale = "bg"
): string {
  const p = catalog(locale).poi;
  if (type === "hotel") return p.hotel;
  if (type === "charging") return p.charging;
  if (type === "restaurant") return p.restaurant;
  if (type === "rest_area") return p.restArea;
  if (type === "attraction" || type === "viewpoint") return p.attraction;
  return p.fuelStation;
}

function fallbackName(type: PoiType): string {
  return poiFallbackName(type, "bg");
}

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function hasExtraType(types: PoiType[]): boolean {
  return types.some(
    (type) => !(CONTRACT_POI_TYPES as readonly string[]).includes(type)
  );
}

function unique(types: PoiType[]): PoiType[] {
  return [...new Set(types)];
}

function round5(value: number): number {
  return Math.round(value * 100_000) / 100_000;
}
