import { cachedValue } from "@/lib/cache/shared-cache";
import { haversineKm } from "@/lib/geo/haversine";
import type { TrafficIncident } from "@/lib/api-clients/tomtom";
import { tilesFor, type Bbox } from "@/lib/traffic/tiles";

/**
 * HERE Traffic API v7 (incidents). The key is server-side only and goes in the
 * query string as HERE requires, so errors never echo the URL. Answers are kept
 * in memory for a few minutes, never in the database: HERE's terms are not
 * clear about keeping traffic data.
 */
const BASE = "https://data.traffic.hereapi.com/v7/incidents";
const TIMEOUT_MS = 8_000;
const MAX_PER_TILE = 150;

/**
 * Seconds a tile is reused (HERE_CACHE_SECONDS, default 300). One-degree tiles add
 * up quickly, so a short lifetime would burn a free monthly quota in days.
 */
export function hereTtlSeconds(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number.parseInt(env.HERE_CACHE_SECONDS ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(3600, Math.max(0, parsed)) : 300;
}

export function hereKey(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.HERE_API_KEY?.trim() || null;
}

interface HereIncident {
  location?: {
    shape?: { links?: Array<{ points?: Array<{ lat?: number; lng?: number }> }> };
  };
  incidentDetails?: {
    id?: string;
    type?: string;
    criticality?: string;
    description?: { value?: string };
    summary?: { value?: string };
    startTime?: string;
    endTime?: string;
    roadClosed?: boolean;
  };
}

const TYPES: Record<string, TrafficIncident["type"]> = {
  accident: "accident",
  congestion: "congestion",
  construction: "construction",
  roadClosure: "road_closure",
  weather: "weather",
};

const SEVERITY: Record<string, TrafficIncident["severity"] | undefined> = {
  critical: "critical",
  major: "major",
  minor: "moderate",
  // "low" is dropped: it would only add clutter to the map.
};

/** One HERE incident as the app's own shape; null when it cannot be placed or is minor. */
export function mapHereIncident(raw: HereIncident): TrafficIncident | null {
  const details = raw.incidentDetails;
  const point = raw.location?.shape?.links?.[0]?.points?.[0];
  if (!details?.id || typeof point?.lat !== "number" || typeof point.lng !== "number") {
    return null;
  }
  const severity = SEVERITY[details.criticality ?? ""];
  if (!severity) return null;
  const text = details.summary?.value ?? details.description?.value ?? "";
  return {
    id: `here-${details.id}`,
    type: details.roadClosed ? "road_closure" : (TYPES[details.type ?? ""] ?? "other"),
    title: text.slice(0, 120) || "Traffic incident",
    description: details.description?.value ?? text,
    coords: { lng: point.lng, lat: point.lat },
    severity,
    delayMin: 0,
    publishedAt: details.startTime ?? "",
    updatedAt: details.startTime ?? "",
  };
}

async function fetchTile(
  tile: Bbox,
  key: string,
  fetchImpl: typeof fetch,
  onError?: (message: string) => void
): Promise<TrafficIncident[] | null> {
  const params = new URLSearchParams({
    in: `bbox:${tile.w},${tile.s},${tile.e},${tile.n}`,
    locationReferencing: "shape",
    lang: "en-US",
    apiKey: key,
  });
  try {
    const response = await fetchImpl(`${BASE}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      let detail = "";
      try {
        const body = (await response.json()) as {
          title?: unknown;
          cause?: unknown;
          error_description?: unknown;
          message?: unknown;
        };
        const raw = body.cause ?? body.error_description ?? body.message ?? body.title;
        detail = typeof raw === "string" ? raw.slice(0, 160) : "";
      } catch {
        detail = "";
      }
      onError?.(`${response.status} ${detail}`.trim());
      return null;
    }
    const body = (await response.json()) as { results?: HereIncident[] };
    return (body.results ?? [])
      .map(mapHereIncident)
      .filter((incident): incident is TrafficIncident => incident !== null)
      .slice(0, MAX_PER_TILE);
  } catch {
    onError?.("the service did not answer");
    return null;
  }
}

/** Serious incidents in an area from HERE; empty without a key or on failure. */
export async function getHereIncidents(
  bbox: Bbox,
  deps: {
    key?: string | null;
    fetchImpl?: typeof fetch;
    ttlSeconds?: number;
    onError?: (message: string) => void;
  } = {}
): Promise<TrafficIncident[]> {
  const key = deps.key === undefined ? hereKey() : deps.key;
  if (!key) return [];
  const fetchImpl = deps.fetchImpl ?? fetch;
  const tiles = await Promise.all(
    tilesFor(bbox).map((tile) =>
      cachedValue<TrafficIncident[]>({
        key: `here|inc|${tile.w}|${tile.s}`,
        kind: "here_incidents",
        ttlMs: (deps.ttlSeconds ?? hereTtlSeconds()) * 1000,
        persist: false,
        load: () => fetchTile(tile, key, fetchImpl, deps.onError),
      }).then((result) => result.value ?? [])
    )
  );
  return tiles.flat();
}

/** HERE and TomTom often report the same crash: keep the first, drop near twins. */
export function mergeIncidents(
  primary: TrafficIncident[],
  extra: TrafficIncident[],
  nearKm = 0.25
): TrafficIncident[] {
  const merged = [...primary];
  for (const incident of extra) {
    const twin = merged.some(
      (other) =>
        other.type === incident.type &&
        haversineKm(other.coords, incident.coords) <= nearKm
    );
    if (!twin) merged.push(incident);
  }
  return merged;
}
