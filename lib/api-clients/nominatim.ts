import type { RoutePoint } from "@/types/route.types";

export interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  postcode?: string;
  country?: string;
}

interface NominatimResult {
  place_id: number;
  osm_type: string;
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  address?: NominatimAddress;
}

/** Street + number when Nominatim has them; otherwise the place name. */
export function formatNominatimAddress(result: {
  name?: string;
  display_name: string;
  address?: NominatimAddress;
}): { label: string; subtitle: string } {
  const address = result.address ?? {};
  const road = address.road ?? address.pedestrian ?? address.footway;
  const locality =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.hamlet;
  const country = address.country;
  const postcode = address.postcode;

  let label: string;
  if (road && address.house_number) {
    label = `${road} ${address.house_number}`;
  } else if (road) {
    label = road;
  } else if (result.name && result.name !== locality) {
    label = result.name;
  } else {
    label = locality || result.display_name.split(",")[0]!.trim();
  }

  const subtitleParts = [
    address.suburb && address.suburb !== label ? address.suburb : null,
    locality && locality !== label ? locality : null,
    postcode,
    country,
  ].filter(Boolean);

  let subtitle = subtitleParts.join(", ");
  if (!subtitle || subtitle === label) {
    subtitle = result.display_name
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part && part !== label)
      .slice(0, 4)
      .join(", ");
  }

  return { label, subtitle: subtitle || result.display_name };
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

  const { label, subtitle } = formatNominatimAddress(result);

  return {
    id: `geocode:${result.osm_type}:${result.osm_id}:${result.place_id}`,
    label,
    subtitle,
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
    limit: "8",
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

/** Reverse-geocode a GPS fix in Europe. Server-side only. */
export async function reverseEuropeanPlace(
  lat: number,
  lng: number
): Promise<RoutePoint | null> {
  if (!isInEurope(lat, lng)) return null;

  const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = resultCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.places[0] ?? null;
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    addressdetails: "1",
    zoom: "14",
    "accept-language": "bg,en",
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${getBaseUrl()}/reverse?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "BG-Road-Navigator/1.0 (travel planning)",
      },
      signal: controller.signal,
      next: { revalidate: 600 },
    });

    if (!response.ok) return null;

    const result = (await response.json()) as NominatimResult;
    const place = toRoutePoint(result);
    resultCache.set(cacheKey, {
      places: place ? [place] : [],
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return place;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
