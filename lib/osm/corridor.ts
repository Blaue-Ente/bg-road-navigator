import { isInEurope } from "@/lib/geo/bounds";
import { haversineKm } from "@/lib/geo/haversine";
import { readOsmCache, writeOsmCache } from "@/lib/nakordoni/cache-store";
import { distanceToPolylineKm, pointAtDistance } from "@/lib/planner/line";

export interface OsmPlace {
  id: string;
  name: string;
  brand: string | null;
  lat: number;
  lng: number;
  kind: "fuel" | "charging_station" | "hotel";
  motorwayService: boolean;
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const TTL_MS = 24 * 60 * 60 * 1000;

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function parseOverpassPlaces(
  payload: unknown,
  kind: OsmPlace["kind"]
): OsmPlace[] {
  const elements =
    (payload as { elements?: OverpassElement[] } | null)?.elements ?? [];
  const places: OsmPlace[] = [];
  for (const element of elements) {
    const lat = element.lat ?? element.center?.lat;
    const lng = element.lon ?? element.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    if (!isInEurope(lng, lat)) continue;
    const tags = element.tags ?? {};
    const name =
      tags.name ??
      tags["name:bg"] ??
      tags.operator ??
      tags.brand ??
      fallbackName(kind);
    places.push({
      id: `osm-${element.type}-${element.id}`,
      name,
      brand: tags.brand ?? tags.operator ?? null,
      lat,
      lng,
      kind,
      motorwayService:
        tags.highway === "services" ||
        tags.motorway === "yes" ||
        tags.service === "rest_area",
    });
  }
  return places;
}

export interface OsmLookup {
  places: OsmPlace[];
  ok: boolean;
}

/** Stations inside a padded bbox of a route window, then kept only if they sit near the line. */
export async function placesAlong(
  line: Array<[number, number]>,
  fromKm: number,
  toKm: number,
  kind: OsmPlace["kind"]
): Promise<OsmLookup> {
  const slice = sliceLine(line, fromKm, toKm);
  if (slice.length === 0) return { places: [], ok: true };

  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const [lng, lat] of slice) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  const pad = 0.05;
  west -= pad;
  east += pad;
  south -= pad;
  north += pad;

  const key = `${kind}:bbox:${west.toFixed(2)}:${south.toFixed(2)}:${east.toFixed(2)}:${north.toFixed(2)}`;
  const filter = amenityFilter(
    kind,
    `(${south.toFixed(4)},${west.toFixed(4)},${north.toFixed(4)},${east.toFixed(4)})`
  );
  const loaded = await fetchOverpass(key, kind, filter, 60);
  if (!loaded.ok) return loaded;
  return {
    ok: true,
    places: loaded.places.filter(
      (place) =>
        distanceToPolylineKm(slice, place).distanceKm <= 6 &&
        isInEurope(place.lng, place.lat)
    ),
  };
}

export async function placesNear(
  lat: number,
  lng: number,
  kind: OsmPlace["kind"]
): Promise<OsmLookup> {
  if (!isInEurope(lng, lat)) return { places: [], ok: true };
  const radius = kind === "hotel" ? 12_000 : 8_000;
  const key = `${kind}:${lat.toFixed(2)}:${lng.toFixed(2)}`;
  const filter = amenityFilter(kind, `(around:${radius},${lat},${lng})`);
  return fetchOverpass(key, kind, filter, 40);
}

function amenityFilter(kind: OsmPlace["kind"], area: string): string {
  if (kind === "fuel") {
    return `node["amenity"="fuel"]${area};
  way["amenity"="fuel"]${area};
  node["highway"="services"]${area};`;
  }
  if (kind === "charging_station") {
    return `node["amenity"="charging_station"]${area};
  way["amenity"="charging_station"]${area};`;
  }
  return `node["tourism"~"hotel|motel|guest_house"]${area};
  way["tourism"~"hotel|motel|guest_house"]${area};`;
}

async function fetchOverpass(
  key: string,
  kind: OsmPlace["kind"],
  filter: string,
  limit: number
): Promise<OsmLookup> {
  const cached = await readOsmCache(key);
  if (Array.isArray(cached)) return { places: cached as OsmPlace[], ok: true };

  const query = `[out:json][timeout:12];(\n${filter}\n);out center ${limit};`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json",
        "User-Agent": "BG-Road-Navigator/1.0 (trip planning)",
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) return { places: [], ok: false };
    const places = parseOverpassPlaces(await response.json(), kind);
    await writeOsmCache({ key, kind, payload: places, ttlMs: TTL_MS });
    return { places, ok: true };
  } catch {
    return { places: [], ok: false };
  } finally {
    clearTimeout(timer);
  }
}

function sliceLine(
  line: Array<[number, number]>,
  fromKm: number,
  toKm: number
): Array<[number, number]> {
  if (line.length === 0) return [];
  const startKm = Math.max(0, Math.min(fromKm, toKm));
  const endKm = Math.max(startKm, toKm);
  const start = pointAtDistance(line, startKm);
  const end = pointAtDistance(line, endKm);
  const points: Array<[number, number]> = [[start.lng, start.lat]];
  let travelled = 0;
  for (let i = 1; i < line.length; i++) {
    const previous = line[i - 1]!;
    const current = line[i]!;
    travelled += haversineKm(
      { lng: previous[0], lat: previous[1] },
      { lng: current[0], lat: current[1] }
    );
    if (travelled > startKm && travelled < endKm) points.push(current);
    if (travelled >= endKm) break;
  }
  points.push([end.lng, end.lat]);
  return points;
}

function fallbackName(kind: OsmPlace["kind"]): string {
  if (kind === "hotel") return "Място за нощувка";
  if (kind === "charging_station") return "Зарядна станция";
  return "Бензиностанция";
}
