import { placesAlong, type OsmPlace } from "@/lib/osm/corridor";
import { readOsmCache, writeOsmCache } from "@/lib/nakordoni/cache-store";
import { fetchPoiCorridor, parsePoiCollection, toPoiPolyline } from "@/lib/poi/client";
import { overpassFallbackEnabled, readPoiConfig } from "@/lib/poi/config";
import {
  CONTRACT_POI_TYPES,
  type CorridorPlace,
  type PoiCollection,
  type PoiItem,
  type PoiType,
} from "@/lib/poi/types";

const BUFFER_M = 5_000;
const LIMIT = 250;
const TTL_MS = 12 * 60 * 60 * 1000;

export interface CorridorLoad {
  places: CorridorPlace[];
  ok: boolean;
  source: "poi" | "overpass" | "none";
  osmTimestamp: string | null;
}

export async function loadCorridorPlaces(input: {
  line: Array<[number, number]>;
  extraTypes?: PoiType[];
}): Promise<CorridorLoad> {
  const types = unique([
    ...CONTRACT_POI_TYPES,
    ...(input.extraTypes ?? []),
  ]);
  const polyline = toPoiPolyline(input.line);
  if (polyline.length < 2) {
    return { places: [], ok: true, source: "none", osmTimestamp: null };
  }
  const key = cacheKey(polyline, types);
  const cached = parsePoiCollection(await readOsmCache(key));
  if (cached) {
    return {
      places: cached.items.map((item) => toPlace(item, "poi")),
      ok: true,
      source: cached.source === "overpass" ? "overpass" : "poi",
      osmTimestamp: cached.osm_timestamp,
    };
  }

  const config = readPoiConfig();
  if (config) {
    const loaded = await fetchPoiCorridor(config, {
      polyline,
      bufferM: BUFFER_M,
      types,
      limit: LIMIT,
    });
    if (loaded) {
      await writeOsmCache({
        key,
        kind: "poi-corridor",
        payload: loaded,
        ttlMs: TTL_MS,
      });
      return {
        places: loaded.items.map((item) => toPlace(item, "poi")),
        ok: true,
        source: "poi",
        osmTimestamp: loaded.osm_timestamp,
      };
    }
  }

  if (!overpassFallbackEnabled()) {
    return { places: [], ok: false, source: "none", osmTimestamp: null };
  }

  const fallback = await overpassPlaces(input.line);
  const collection: PoiCollection = {
    items: fallback.map(overpassItem),
    source: "overpass",
    osm_timestamp: null,
  };
  if (fallback.length > 0) {
    await writeOsmCache({
      key,
      kind: "poi-corridor",
      payload: collection,
      ttlMs: TTL_MS,
    });
  }
  return {
    places: collection.items.map((item) => toPlace(item, "overpass")),
    ok: fallback.length > 0,
    source: "overpass",
    osmTimestamp: null,
  };
}

export function toPlace(
  item: PoiItem,
  source: CorridorPlace["source"]
): CorridorPlace {
  const tags = item.tags;
  return {
    id: item.id,
    name: item.name,
    brand: item.brand ?? item.operator,
    lat: item.lat,
    lng: item.lon,
    kind: item.type,
    motorwayService:
      item.type === "rest_area" ||
      tags.highway === "services" ||
      tags.motorway === "yes" ||
      tags.service === "rest_area",
    tags,
    alongM: item.along_m,
    distM: item.dist_m,
    source,
  };
}

async function overpassPlaces(
  line: Array<[number, number]>
): Promise<OsmPlace[]> {
  const end = 20_000;
  const [fuel, charging, hotels] = await Promise.all([
    placesAlong(line, 0, end, "fuel"),
    placesAlong(line, 0, end, "charging_station"),
    placesAlong(line, 0, end, "hotel"),
  ]);
  return [...fuel.places, ...charging.places, ...hotels.places];
}

function overpassItem(place: OsmPlace): PoiItem {
  const type: PoiType =
    place.kind === "charging_station"
      ? "charging"
      : place.kind === "hotel"
        ? "hotel"
        : place.motorwayService
          ? "rest_area"
          : "fuel";
  return {
    id: place.id,
    type,
    name: place.name,
    brand: place.brand,
    operator: place.brand,
    lat: place.lat,
    lon: place.lng,
    tags: place.motorwayService ? { highway: "services" } : {},
    dist_m: null,
    along_m: null,
  };
}

function cacheKey(polyline: Array<[number, number]>, types: PoiType[]): string {
  const body = polyline
    .map(([lat, lon]) => `${lat.toFixed(3)},${lon.toFixed(3)}`)
    .join(";");
  return `poi:${BUFFER_M}:${[...types].sort().join(",")}:${fnv(body)}`;
}

function fnv(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function unique(types: PoiType[]): PoiType[] {
  return [...new Set(types)];
}
