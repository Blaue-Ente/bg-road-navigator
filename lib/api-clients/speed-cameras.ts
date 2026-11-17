import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import { isInEurope } from "@/lib/geo/bounds";
import { cachedValue } from "@/lib/cache/shared-cache";

const OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];
/** Camera positions are OpenStreetMap data (ODbL), so a tile is kept for a day, shared through the database. */
const TILE_TTL_MS = 24 * 3_600_000;
const TIMEOUT_MS = 9_000;
/** Tiles keep the cached answers shared between nearby map views. */
export const CAMERA_TILE_DEG = 0.5;
const MAX_TILES = 6;
const MAX_NODES_PER_TILE = 300;

/** Positions of fixed cameras are not shown where the law bans them outright. */
export const CAMERA_HIDDEN_COUNTRIES = new Set(["FR", "CH"]);
/** Warnings while driving are banned here; the map still shows the points. */
export const CAMERA_WARNING_BANNED_COUNTRIES = new Set(["DE", "AT"]);

export interface SpeedCamera {
  id: string;
  lng: number;
  lat: number;
  /** Posted limit in km/h, when OpenStreetMap has it. */
  maxspeed: number | null;
}

export interface SpeedCameraResult {
  cameras: SpeedCamera[];
  /** False when every upstream failed, so the client can say so. */
  ok: boolean;
  /** Why each mirror failed (status or kind only), for ?debug=1. */
  errors?: string[];
}

interface OverpassNode {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
}

export function tilesForBbox(bbox: {
  w: number;
  s: number;
  e: number;
  n: number;
}): Array<{ w: number; s: number; e: number; n: number }> {
  const snap = (value: number, up: boolean) =>
    (up ? Math.ceil : Math.floor)(value / CAMERA_TILE_DEG) * CAMERA_TILE_DEG;
  const tiles: Array<{ w: number; s: number; e: number; n: number }> = [];
  for (let w = snap(bbox.w, false); w < bbox.e; w += CAMERA_TILE_DEG) {
    for (let s = snap(bbox.s, false); s < bbox.n; s += CAMERA_TILE_DEG) {
      tiles.push({
        w: round(w),
        s: round(s),
        e: round(w + CAMERA_TILE_DEG),
        n: round(s + CAMERA_TILE_DEG),
      });
      if (tiles.length > MAX_TILES) return tiles;
    }
  }
  return tiles;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function parseMaxspeed(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/^(\d{2,3})(?:\s*km\/h)?$/i);
  if (!match) return null;
  const value = Number(match[1]);
  return value >= 20 && value <= 140 ? value : null;
}

export function parseSpeedCameras(payload: unknown): SpeedCamera[] {
  const elements = (payload as { elements?: OverpassNode[] } | null)?.elements;
  if (!Array.isArray(elements)) return [];
  const out: SpeedCamera[] = [];
  for (const element of elements) {
    if (
      element.type !== "node" ||
      typeof element.id !== "number" ||
      typeof element.lat !== "number" ||
      typeof element.lon !== "number" ||
      !isInEurope(element.lon, element.lat)
    ) {
      continue;
    }
    const country = countryCodeAtPoint(element.lon, element.lat);
    if (country && CAMERA_HIDDEN_COUNTRIES.has(country)) continue;
    out.push({
      id: `osm-cam-${element.id}`,
      lng: element.lon,
      lat: element.lat,
      maxspeed: parseMaxspeed(element.tags?.maxspeed),
    });
  }
  return out;
}

/** Failure reasons of the last live calls, newest last; shown only with ?debug=1. */
const recentErrors: string[] = [];
function noteError(message: string): void {
  recentErrors.push(message);
  if (recentErrors.length > 6) recentErrors.shift();
}
export function recentCameraErrors(): string[] {
  return [...recentErrors];
}

async function fetchTileLive(
  tile: { w: number; s: number; e: number; n: number },
  fetchImpl: typeof fetch
): Promise<SpeedCamera[] | null> {
  const query = `[out:json][timeout:8];node["highway"="speed_camera"](${tile.s},${tile.w},${tile.n},${tile.e});out body ${MAX_NODES_PER_TILE};`;
  const attempt = async (base: string): Promise<SpeedCamera[]> => {
    const host = new URL(base).hostname;
    try {
      return await attemptOnce(base);
    } catch (error) {
      noteError(`${host}: ${error instanceof Error ? `${error.name} ${error.message}`.slice(0, 80) : "failed"}`);
      throw error;
    }
  };
  const attemptOnce = async (base: string): Promise<SpeedCamera[]> => {
    const response = await fetchImpl(`${base}?data=${encodeURIComponent(query)}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BG-Road-Navigator/1.0 (travel planning)",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`overpass ${response.status}`);
    return parseSpeedCameras(await response.json());
  };
  try {
    // Ask every mirror at once and take the first answer: the public ones are
    // often slow or refuse a cloud address, and waiting for each in turn took 18 s.
    return await Promise.any(OVERPASS_URLS.map((base) => attempt(base)));
  } catch {
    return null;
  }
}

function fetchTile(
  tile: { w: number; s: number; e: number; n: number },
  fetchImpl: typeof fetch
): Promise<SpeedCamera[] | null> {
  return cachedValue<SpeedCamera[]>({
    key: `cam|${tile.w}|${tile.s}`,
    kind: "speed_cameras",
    ttlMs: TILE_TTL_MS,
    persist: true,
    load: () => fetchTileLive(tile, fetchImpl),
  }).then((result) => result.value);
}

export async function loadSpeedCameras(
  bbox: { w: number; s: number; e: number; n: number },
  fetchImpl: typeof fetch = fetch
): Promise<SpeedCameraResult> {
  const tiles = tilesForBbox(bbox);
  if (tiles.length === 0 || tiles.length > MAX_TILES) {
    return { cameras: [], ok: true };
  }
  const batches = await Promise.all(
    tiles.map((tile) => fetchTile(tile, fetchImpl))
  );
  const seen = new Set<string>();
  const cameras: SpeedCamera[] = [];
  for (const batch of batches) {
    for (const camera of batch ?? []) {
      if (seen.has(camera.id)) continue;
      seen.add(camera.id);
      cameras.push(camera);
    }
  }
  return { cameras, ok: batches.some((batch) => batch !== null) };
}
