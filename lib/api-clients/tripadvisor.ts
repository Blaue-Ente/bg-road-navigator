/**
 * Tripadvisor Terra (https://docs.terra.tripadvisor.com): ratings and counts only.
 *
 * Terms we follow:
 * - Content is never cached or stored. Requests bypass the Next.js data cache and
 *   the API response is `no-store`; only the Location ID could be kept.
 * - Every listing links back to Tripadvisor (name, review count) and carries the
 *   credit line in the UI. No review text is fetched at all.
 *
 * Cost: the Discover package bills per Location ID returned (the first 1,000
 * are free), so a search asks for a handful of rows, not a page of 20, and a
 * per-instance daily ceiling stops a runaway loop. Set a daily budget in the
 * Tripadvisor dashboard as well.
 */
const BASE = "https://terra.tripadvisor.com/api";
const TIMEOUT_MS = 6_000;
const MAX_ITEMS = 3;
const MAX_RADIUS_KM = 8;
const DEFAULT_SIZE = 6;
const DEFAULT_DAILY_LIMIT = 200;

export interface TripadvisorStay {
  id: string;
  name: string;
  rating: number | null;
  reviews: number | null;
  /** Tripadvisor's own bubble-rating image. */
  rating_icon_url: string | null;
  /** The listing on Tripadvisor. */
  url: string | null;
  distance_km: number | null;
  address: string | null;
}

/** Also accepts the names people tend to use for the key. */
const KEY_NAMES = [
  "TRIPADVISOR_API_KEY",
  "TRIPADVISOR_API",
  "TRIPADVISOR_TRAVELER_API",
  "TRIPADVISOR_TRAVALER_API",
] as const;

export function tripadvisorKey(env: NodeJS.ProcessEnv = process.env): string | null {
  for (const name of KEY_NAMES) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  // Any other TRIPADVISOR_* variable that holds a single token-like value.
  for (const [name, raw] of Object.entries(env)) {
    const value = raw?.trim();
    if (name.startsWith("TRIPADVISOR") && value && /^[\w-]{16,}$/.test(value)) {
      return value;
    }
  }
  return null;
}

function intFromEnv(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/** How many rows one search may bill (each returned Location ID is one unit). */
export function resultSize(env: NodeJS.ProcessEnv = process.env): number {
  return intFromEnv(env.TRIPADVISOR_RESULT_SIZE, DEFAULT_SIZE, 1, 20);
}

const usage = { day: "", calls: 0 };

/** True while this instance is under today's ceiling; counts the call when so. */
export function takeDailyCall(
  now: Date = new Date(),
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const day = now.toISOString().slice(0, 10);
  if (usage.day !== day) {
    usage.day = day;
    usage.calls = 0;
  }
  const limit = intFromEnv(env.TRIPADVISOR_DAILY_LIMIT, DEFAULT_DAILY_LIMIT, 1, 100_000);
  if (usage.calls >= limit) return false;
  usage.calls += 1;
  return true;
}

/** Test helper. */
export function resetDailyCalls(): void {
  usage.day = "";
  usage.calls = 0;
}

async function describeFailure(response: Response): Promise<string> {
  let detail = "";
  try {
    const body = (await response.json()) as {
      detail?: unknown;
      message?: unknown;
      title?: unknown;
      error?: { message?: unknown } | string;
    };
    const raw =
      typeof body.error === "string"
        ? body.error
        : (body.error?.message ?? body.detail ?? body.message ?? body.title);
    detail = typeof raw === "string" ? raw.slice(0, 200) : "";
  } catch {
    detail = "";
  }
  return `${response.status} ${detail}`.trim();
}

interface TranslationRow {
  language?: string;
  value?: string;
  primary?: boolean;
}

interface NearbyRow {
  distance_kilometers?: number | string;
  location?: {
    id?: number | string;
    names?: TranslationRow[];
    addresses?: { formatted?: string; street_address?: string; city?: string }[];
    overall_rating?: { count?: number | string; rating?: number | string; icon_url?: string };
    urls?: { tripadvisor?: { main?: string } };
  };
}

function num(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

function httpsUrl(value: unknown): string | null {
  return typeof value === "string" && /^https:\/\//.test(value) ? value : null;
}

function pickName(names: TranslationRow[] | undefined): string {
  const list = names ?? [];
  return (list.find((row) => row.primary) ?? list[0])?.value?.trim() ?? "";
}

/** Maps one Terra catalog row to what the page shows. */
export function toStay(row: NearbyRow): TripadvisorStay | null {
  const location = row.location;
  if (!location || location.id == null) return null;
  const address = location.addresses?.[0];
  return {
    id: String(location.id),
    name: pickName(location.names),
    rating: num(location.overall_rating?.rating),
    reviews: num(location.overall_rating?.count),
    rating_icon_url: httpsUrl(location.overall_rating?.icon_url),
    url: httpsUrl(location.urls?.tripadvisor?.main),
    distance_km: num(row.distance_kilometers),
    address: address?.formatted?.trim() || address?.street_address?.trim() || null,
  };
}

/** Best-rated places to stay near a point, with Tripadvisor's own link for each. */
export async function nearbyStays(
  input: { lat: number; lng: number; radiusKm?: number },
  deps: {
    key?: string | null;
    fetchImpl?: typeof fetch;
    /** Called with why a request failed, without the key. */
    onError?: (message: string) => void;
    size?: number;
  } = {}
): Promise<TripadvisorStay[] | null> {
  const key = deps.key === undefined ? tripadvisorKey() : deps.key;
  if (!key) return null;
  if (!takeDailyCall()) {
    deps.onError?.("daily call limit reached on this server");
    return null;
  }
  const fetchImpl = deps.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    version: "1",
    lat: input.lat.toFixed(5),
    lon: input.lng.toFixed(5),
    radius: String(Math.min(MAX_RADIUS_KM, input.radiusKm ?? MAX_RADIUS_KM)),
    unit: "KM",
    category: "HOTEL",
    min_rating: "3.5",
    sort: "rating,desc",
    size: String(deps.size ?? resultSize()),
  });
  try {
    const response = await fetchImpl(`${BASE}/catalog/locations/nearby?${params}`, {
      headers: { Accept: "application/json", "X-API-Key": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      // Terra forbids keeping its content: always ask, never reuse.
      cache: "no-store",
    });
    if (!response.ok) {
      // Never echo the URL or key, only the status and Tripadvisor's message.
      deps.onError?.(await describeFailure(response));
      return null;
    }
    const body = (await response.json()) as { data?: NearbyRow[] };
    const stays = (body.data ?? [])
      .map(toStay)
      .filter((stay): stay is TripadvisorStay => stay !== null);
    return rankStays(stays).slice(0, MAX_ITEMS);
  } catch {
    deps.onError?.("the service did not answer");
    return null;
  }
}

/** Highest rating first, with enough reviews to mean something. */
export function rankStays(stays: TripadvisorStay[]): TripadvisorStay[] {
  return stays
    .filter((stay) => stay.name && stay.url && stay.rating != null)
    .sort((a, b) => {
      const weight = (stay: TripadvisorStay) =>
        (stay.rating ?? 0) * Math.min(1, (stay.reviews ?? 0) / 50 + 0.4);
      return weight(b) - weight(a);
    });
}
