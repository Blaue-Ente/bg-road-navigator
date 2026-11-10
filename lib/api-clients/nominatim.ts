import type { RoutePoint } from "@/types/route.types";

interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  importance?: number;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
    country_code?: string;
  };
}

const DEFAULT_NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const SEARCH_TIMEOUT_MS = 8_000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const EUROPE_BOUNDS = {
  minLat: 34,
  maxLat: 72,
  minLng: -25,
  maxLng: 45,
};

const resultCache = new Map<
  string,
  { expiresAt: number; places: RoutePoint[] }
>();

function getBaseUrl(): string {
  return (process.env.GEOCODING_API_URL ?? DEFAULT_NOMINATIM_URL).replace(
    /\/$/,
    ""
  );
}

function isInEurope(lat: number, lng: number): boolean {
  return (
    lat >= EUROPE_BOUNDS.minLat &&
    lat <= EUROPE_BOUNDS.maxLat &&
    lng >= EUROPE_BOUNDS.minLng &&
    lng <= EUROPE_BOUNDS.maxLng
  );
}

function toRoutePoint(result: NominatimResult): RoutePoint | null {
  const lat = Number(result.lat);
  const lng = Number(result.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !isInEurope(lat, lng)) {
    return null;
  }

  const locality =
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.address?.municipality;
  const country = result.address?.country;
  const street = [result.address?.road, result.address?.house_number]
    .filter(Boolean)
    .join(" ");
  const label =
    street || result.name || locality || result.display_name.split(",")[0]!;
  const subtitle = [locality && locality !== label ? locality : null, country]
    .filter(Boolean)
    .join(", ");

  const countryCode = result.address?.country_code?.toUpperCase();

  return {
    id: `geocode:${result.osm_type}:${result.osm_id}:${result.place_id}`,
    label,
    subtitle: subtitle || result.display_name,
    coords: { lng, lat },
    source: "geocoder",
    countryCode,
  };
}

const STREET_PREFIX =
  /^(ул|улица|бул|булевард|пл|площад|ul|ulitsa|bul|blvd|pl|street|str|via|piazza|platz|út|ut)\.?$/iu;

function queryTokens(value: string): string[] {
  return value
    .toLocaleLowerCase("bg-BG")
    .split(/[\s,]+/)
    .map((token) => token.replace(/^[.]+|[.]+$/g, ""))
    .filter(
      (token) =>
        token.length >= 3 && !STREET_PREFIX.test(token) && !/^\d+[a-zа-я]?$/iu.test(token)
    );
}

/** Drop "ул." / "бул." but keep the house number. Nominatim often misses the prefixed form. */
export function streetAndCity(query: string): { street: string; city: string } | null {
  const parts = query
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const city = parts[parts.length - 1] ?? "";
  const street = (parts.slice(0, -1).join(" ") ?? "")
    .split(/\s+/)
    .filter((token) => !STREET_PREFIX.test(token))
    .join(" ")
    .trim();
  if (street.length < 3 || city.length < 2) return null;
  return { street, city };
}

function roadMatchesQuery(result: NominatimResult, street: string): boolean {
  const road = `${result.address?.road ?? ""} ${result.name ?? ""}`.toLocaleLowerCase(
    "bg-BG"
  );
  return queryTokens(street).some((token) => road.includes(token));
}

function scoreResult(result: NominatimResult, query: string): number {
  const address = result.address;
  let score = (result.importance ?? 0) * 4;
  const road = (address?.road ?? "").toLocaleLowerCase("bg-BG");
  const name = (result.name ?? "").toLocaleLowerCase("bg-BG");
  const locality = [
    address?.city,
    address?.town,
    address?.village,
    address?.municipality,
    result.display_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("bg-BG");
  const tokens = queryTokens(query);
  let roadHits = 0;
  for (const token of tokens) {
    if (road.includes(token)) roadHits += 1;
    else if (name.includes(token)) score += 1;
    if (locality.includes(token)) score += 2;
  }
  score += roadHits * 5;
  if (tokens.length > 0 && road && roadHits === 0) score -= 4;
  const askedNumber = query.match(/(?:^|\s)(\d+[a-zа-я]?)(?:\s|,|$)/iu)?.[1];
  if (askedNumber && address?.house_number === askedNumber) score += 8;
  else if (address?.house_number) score += 2;
  if (result.type === "house" || result.type === "building") score += 3;
  if (result.type === "pedestrian") score += 3;
  if (result.type === "primary" || result.type === "secondary" || result.type === "tertiary") {
    score += 2;
  }
  return score;
}

/** Prefer a street address over a city centroid when both match the query. */
export function rankNominatimResults(
  results: NominatimResult[],
  query: string
): NominatimResult[] {
  return [...results].sort(
    (a, b) => scoreResult(b, query) - scoreResult(a, query)
  );
}

async function fetchNominatim(
  params: URLSearchParams
): Promise<NominatimResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${getBaseUrl()}/search?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BG-Road-Navigator/1.0 (travel planning)",
      },
      signal: controller.signal,
      next: { revalidate: 600 },
    });
    if (!response.ok) return [];
    return (await response.json()) as NominatimResult[];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function toPlaces(results: NominatimResult[], query: string): RoutePoint[] {
  return rankNominatimResults(results, query)
    .map(toRoutePoint)
    .filter((place): place is RoutePoint => Boolean(place));
}

/**
 * Searches for user-entered destinations in Europe. Calls run server-side only;
 * production can set GEOCODING_API_URL to a contracted/self-hosted provider.
 */
export async function searchEuropeanPlaces(
  query: string
): Promise<RoutePoint[]> {
  const trimmed = query.trim();
  const normalizedQuery = trimmed.toLocaleLowerCase("bg-BG");
  const cached = resultCache.get(normalizedQuery);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.places;
  }

  const free = await fetchNominatim(
    new URLSearchParams({
      q: trimmed,
      format: "jsonv2",
      addressdetails: "1",
      limit: "7",
      "accept-language": "bg,en",
    })
  );

  let combined = free;
  const split = streetAndCity(trimmed);
  const freeHitsStreet =
    split != null && free.some((result) => roadMatchesQuery(result, split.street));
  if (split && !freeHitsStreet) {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const structured = await fetchNominatim(
      new URLSearchParams({
        street: split.street,
        city: split.city,
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
        "accept-language": "bg,en",
      })
    );
    const seen = new Set(free.map((result) => result.place_id));
    combined = [
      ...free,
      ...structured.filter((result) => !seen.has(result.place_id)),
    ];
  }

  const places = toPlaces(combined, trimmed);
  resultCache.set(normalizedQuery, {
    places,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
  if (resultCache.size > 250) {
    const oldest = resultCache.keys().next().value;
    if (oldest) resultCache.delete(oldest);
  }
  return places;
}
