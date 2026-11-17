import { cachedValue, minutesFromEnv } from "@/lib/cache/shared-cache";
import { tilesFor, type Bbox } from "@/lib/traffic/tiles";

/**
 * TomTom Traffic Incident Details v5. The key is server-side only. TomTom limits
 * an area to 10,000 km2, so a view is split into one-degree tiles, each kept in
 * this server's memory for a short time (TRAFFIC_CACHE_SECONDS, default 300: Incident Details has only 2,500 calls a day)
 * and never stored: TomTom's terms do not clearly allow that.
 */
const BASE_URL = "https://api.tomtom.com/traffic/services/5/incidentDetails";
const TIMEOUT_MS = 8_000;
const MAX_PER_TILE = 150;
/** When TomTom says the daily allowance is used up, stop asking for this long. */
const PAUSE_MS = 10 * 60_000;
let pausedUntilMs = 0;

export function resetTomTomPauseForTests(): void {
  pausedUntilMs = 0;
}
const FIELDS =
  "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,iconCategory},startTime,endTime,from,to,delay,roadNumbers}}}";

export interface TrafficIncident {
  id: string;
  type:
    | "accident"
    | "road_closure"
    | "construction"
    | "lane_restriction"
    | "congestion"
    | "weather"
    | "hazard"
    | "other";
  title: string;
  description: string;
  coords: { lng: number; lat: number };
  severity: "minor" | "moderate" | "major" | "critical";
  delayMin: number;
  publishedAt: string;
  updatedAt: string;
}

interface TomTomIncidentRaw {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: {
    id?: string;
    iconCategory?: number;
    magnitudeOfDelay?: number;
    events?: Array<{ description?: string }>;
    startTime?: string;
    endTime?: string;
    from?: string;
    to?: string;
    delay?: number;
    roadNumbers?: string[];
  };
}

/** TomTom icon categories, grouped the way the map draws them. */
const TYPE_BY_ICON: Record<number, TrafficIncident["type"]> = {
  1: "accident",
  2: "weather",
  3: "hazard",
  4: "weather",
  5: "weather",
  6: "congestion",
  7: "lane_restriction",
  8: "road_closure",
  9: "construction",
  10: "weather",
  11: "weather",
  14: "hazard",
};

const SEVERITY_BY_MAGNITUDE: Record<number, TrafficIncident["severity"]> = {
  0: "minor",
  1: "minor",
  2: "moderate",
  3: "major",
  4: "critical",
};

export function tomtomKey(env: NodeJS.ProcessEnv = process.env): string | null {
  return env.TOMTOM_API_KEY?.trim() || null;
}

function firstPoint(geometry: TomTomIncidentRaw["geometry"]): [number, number] | null {
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates)) return null;
  const point = geometry?.type === "Point" ? coordinates : coordinates[0];
  if (
    Array.isArray(point) &&
    typeof point[0] === "number" &&
    typeof point[1] === "number"
  ) {
    return [point[0], point[1]];
  }
  return null;
}

/** One TomTom incident in the app's shape; null when it cannot be placed or is only a slow patch. */
export function mapTomTomIncident(raw: TomTomIncidentRaw): TrafficIncident | null {
  const properties = raw.properties;
  const point = firstPoint(raw.geometry);
  if (!properties?.id || !point) return null;
  const type = TYPE_BY_ICON[properties.iconCategory ?? 0] ?? "other";
  const severity = SEVERITY_BY_MAGNITUDE[properties.magnitudeOfDelay ?? 0] ?? "minor";
  // Small slowdowns and unclassified notes would only clutter the map.
  if (severity === "minor" && (type === "congestion" || type === "other")) return null;
  const description = (properties.events ?? [])
    .map((event) => event.description)
    .filter((text): text is string => Boolean(text))
    .join(". ");
  const roads = (properties.roadNumbers ?? []).join(", ");
  const place = [properties.from, properties.to].filter(Boolean).join(" → ");
  return {
    id: `tomtom-${properties.id}`,
    type,
    title: (description || place || roads || "Traffic incident").slice(0, 120),
    description: [description, place, roads].filter(Boolean).join(" · "),
    coords: { lng: point[0], lat: point[1] },
    severity,
    delayMin: properties.delay ? Math.floor(properties.delay / 60) : 0,
    publishedAt: properties.startTime ?? "",
    updatedAt: properties.startTime ?? "",
  };
}

async function fetchTile(
  tile: Bbox,
  key: string,
  fetchImpl: typeof fetch,
  onError?: (message: string) => void
): Promise<TrafficIncident[] | null> {
  const params = new URLSearchParams({
    key,
    bbox: `${tile.w},${tile.s},${tile.e},${tile.n}`,
    fields: FIELDS,
    language: "en-GB",
    timeValidityFilter: "present",
  });
  try {
    const response = await fetchImpl(`${BASE_URL}?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      // 429 (rate) and 403 (allowance) mean more calls only waste what is left.
      if (response.status === 429 || response.status === 403) {
        pausedUntilMs = Date.now() + PAUSE_MS;
      }
      let detail = "";
      try {
        const body = (await response.json()) as { error?: unknown; detailedError?: { message?: unknown } };
        const raw = body.detailedError?.message ?? body.error;
        detail = typeof raw === "string" ? raw.slice(0, 160) : "";
      } catch {
        detail = "";
      }
      // Never echo the URL: it carries the key.
      onError?.(`${response.status} ${detail}`.trim());
      return null;
    }
    const body = (await response.json()) as { incidents?: TomTomIncidentRaw[] };
    return (body.incidents ?? [])
      .map(mapTomTomIncident)
      .filter((incident): incident is TrafficIncident => incident !== null)
      .slice(0, MAX_PER_TILE);
  } catch {
    onError?.("the service did not answer");
    return null;
  }
}

/** Incidents in an area from TomTom; empty without a key or on failure. */
export async function getTomTomIncidents(
  bbox: Bbox,
  deps: {
    key?: string | null;
    fetchImpl?: typeof fetch;
    ttlSeconds?: number;
    onError?: (message: string) => void;
  } = {}
): Promise<TrafficIncident[]> {
  const key = deps.key === undefined ? tomtomKey() : deps.key;
  if (!key) return [];
  if (Date.now() < pausedUntilMs) {
    deps.onError?.("paused for a few minutes after TomTom refused (allowance or rate)");
    return [];
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  const ttlSeconds =
    deps.ttlSeconds ?? minutesFromEnv(process.env.TRAFFIC_CACHE_SECONDS, 300, 900);
  const tiles = await Promise.all(
    tilesFor(bbox).map((tile) =>
      cachedValue<TrafficIncident[]>({
        key: `tomtom|inc|${tile.w}|${tile.s}`,
        kind: "tomtom_incidents",
        ttlMs: ttlSeconds * 1000,
        persist: false,
        load: () => fetchTile(tile, key, fetchImpl, deps.onError),
      }).then((result) => result.value ?? [])
    )
  );
  return tiles.flat();
}
