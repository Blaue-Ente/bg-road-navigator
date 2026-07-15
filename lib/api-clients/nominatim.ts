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
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    country?: string;
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

const resultCache = new Map<string, { expiresAt: number; places: RoutePoint[] }>();

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
  const label = result.name || locality || result.display_name.split(",")[0]!;
  const subtitle = [locality && locality !== label ? locality : null, country]
    .filter(Boolean)
    .join(", ");

  return {
    id: `geocode:${result.osm_type}:${result.osm_id}:${result.place_id}`,
    label,
    subtitle: subtitle || result.display_name,
    coords: { lng, lat },
    source: "geocoder",
  };
}

/**
 * Searches for user-entered destinations in Europe. Calls run server-side only;
 * production can set GEOCODING_API_URL to a contracted/self-hosted provider.
 */
export async function searchEuropeanPlaces(query: string): Promise<RoutePoint[]> {
  const normalizedQuery = query.trim().toLocaleLowerCase("bg-BG");
  const cached = resultCache.get(normalizedQuery);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.places;
  }

  const params = new URLSearchParams({
    q: query.trim(),
    format: "jsonv2",
    addressdetails: "1",
    limit: "7",
    "accept-language": "bg,en",
  });
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

    const results = (await response.json()) as NominatimResult[];
    const places = results
      .map(toRoutePoint)
      .filter((place): place is RoutePoint => Boolean(place));

    resultCache.set(normalizedQuery, {
      places,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return places;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
