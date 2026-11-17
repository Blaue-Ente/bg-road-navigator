/**
 * Tripadvisor Content API (location search + details). Ratings and counts only.
 * Terms: show the Tripadvisor attribution and link to the listing, and do not
 * keep the data longer than a day, so answers are cached for six hours.
 */
const BASE = "https://api.content.tripadvisor.com/api/v1/location";
const TIMEOUT_MS = 6_000;
const MAX_ITEMS = 3;

export interface TripadvisorStay {
  id: string;
  name: string;
  rating: number | null;
  reviews: number | null;
  /** "$" to "$$$$" as Tripadvisor reports it. */
  price_level: string | null;
  url: string | null;
  distance_km: number | null;
}

/** Also accepts the names people tend to use for the Traveler-API key. */
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

async function get<T>(
  url: string,
  fetchImpl: typeof fetch,
  onError?: (message: string) => void
): Promise<T | null> {
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 21_600 },
    } as RequestInit);
    if (!response.ok) {
      if (onError) {
        let detail = "";
        try {
          const body = (await response.json()) as {
            error?: { message?: unknown } | string;
            message?: unknown;
          };
          const raw =
            typeof body.error === "string"
              ? body.error
              : (body.error?.message ?? body.message);
          detail = typeof raw === "string" ? raw.slice(0, 200) : "";
        } catch {
          detail = "";
        }
        // Never echo the URL: it carries the key.
        onError(`${response.status} ${detail}`.trim());
      }
      return null;
    }
    return (await response.json()) as T;
  } catch {
    onError?.("the service did not answer");
    return null;
  }
}

interface NearbyRow {
  location_id?: string;
  name?: string;
  distance?: string | number;
}

interface DetailsRow {
  rating?: string | number;
  num_reviews?: string | number;
  price_level?: string;
  web_url?: string;
}

function num(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

/** Best-rated places to stay near a point, with Tripadvisor's own link for each. */
export async function nearbyStays(
  input: { lat: number; lng: number; radiusKm?: number },
  deps: {
    key?: string | null;
    fetchImpl?: typeof fetch;
    /** Called with why a request failed, without the key. */
    onError?: (message: string) => void;
  } = {}
): Promise<TripadvisorStay[] | null> {
  const key = deps.key === undefined ? tripadvisorKey() : deps.key;
  if (!key) return null;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const params = new URLSearchParams({
    latLong: `${input.lat.toFixed(4)},${input.lng.toFixed(4)}`,
    key,
    category: "hotels",
    radius: String(input.radiusKm ?? 10),
    radiusUnit: "km",
    language: "en",
  });
  const nearby = await get<{ data?: NearbyRow[] }>(
    `${BASE}/nearby_search?${params}`,
    fetchImpl,
    deps.onError
  );
  if (!nearby) return null;
  const rows = (nearby.data ?? []).filter((row) => row.location_id).slice(0, 6);
  const detailed = await Promise.all(
    rows.map(async (row) => {
      const details = await get<DetailsRow>(
        `${BASE}/${encodeURIComponent(row.location_id!)}/details?${new URLSearchParams({ key, language: "en", currency: "EUR" })}`,
        fetchImpl
      );
      return {
        id: row.location_id!,
        name: row.name ?? "",
        rating: num(details?.rating),
        reviews: num(details?.num_reviews),
        price_level: details?.price_level ?? null,
        url: details?.web_url ?? null,
        distance_km: num(row.distance),
      } satisfies TripadvisorStay;
    })
  );
  // A listing with no rating or link cannot be shown properly.
  return rankStays(detailed).slice(0, MAX_ITEMS);
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
