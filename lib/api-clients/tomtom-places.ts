import { cachedValue, minutesFromEnv, snapToGrid } from "@/lib/cache/shared-cache";
import { haversineKm } from "@/lib/geo/haversine";
import type { FuelStation } from "@/types/fuel.types";

const TOMTOM_SEARCH_URL = "https://api.tomtom.com/search/2/poiSearch/.json";
const FUEL_STATION_CATEGORY = "7311";

interface TomTomPoiResult {
  id: string;
  poi?: {
    name?: string;
    brands?: Array<{ name?: string }>;
  };
  address?: {
    freeformAddress?: string;
  };
  position?: {
    lat?: number;
    lon?: number;
  };
  dist?: number;
}

interface TomTomPoiResponse {
  results?: TomTomPoiResult[];
}

/** Cells of about 5 km: drivers on similar routes share one answer. */
const CELL_DEG = 0.05;
const CELL_MARGIN_KM = 4;

/**
 * Fuel stations near a point. TomTom's terms do not clearly allow keeping its
 * results, so the answer stays only in this server's memory, for
 * TOMTOM_PLACES_CACHE_MINUTES (default 30), never in the database.
 */
export async function getFuelStations(
  lng: number,
  lat: number,
  radiusKm = 30
): Promise<FuelStation[]> {
  const apiKey = process.env.TOMTOM_API_KEY?.trim();
  if (!apiKey) return [];

  const cellLng = snapToGrid(lng, CELL_DEG);
  const cellLat = snapToGrid(lat, CELL_DEG);
  const reach = Math.ceil(radiusKm) + CELL_MARGIN_KM;
  const { value } = await cachedValue<FuelStation[]>({
    key: `tomtom-fuel|${cellLat.toFixed(2)}|${cellLng.toFixed(2)}|${reach}`,
    kind: "tomtom_fuel",
    ttlMs: minutesFromEnv(process.env.TOMTOM_PLACES_CACHE_MINUTES, 30) * 60_000,
    persist: false,
    load: () => fetchFuelStations(apiKey, cellLng, cellLat, reach),
  });
  return (value ?? [])
    .map((station) => ({
      ...station,
      distance_km: Math.round(haversineKm({ lng, lat }, station.coords) * 10) / 10,
    }))
    .filter((station) => station.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

/** One live call. Null when the service failed, so a failure is never kept. */
async function fetchFuelStations(
  apiKey: string,
  lng: number,
  lat: number,
  radiusKm: number
): Promise<FuelStation[] | null> {
  const params = new URLSearchParams({
    key: apiKey,
    lat: String(lat),
    lon: String(lng),
    radius: String(radiusKm * 1000),
    categorySet: FUEL_STATION_CATEGORY,
    limit: "50",
  });

  try {
    const response = await fetch(`${TOMTOM_SEARCH_URL}?${params}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as TomTomPoiResponse;
    return (payload.results ?? []).flatMap((result) => {
      const position = result.position;
      if (
        typeof position?.lat !== "number" ||
        typeof position.lon !== "number"
      ) {
        return [];
      }

      const name = result.poi?.name ?? "Petrol station";
      return [
        {
          id: `tomtom-${result.id}`,
          name,
          brand: result.poi?.brands?.[0]?.name ?? name,
          coords: { lng: position.lon, lat: position.lat },
          address: result.address?.freeformAddress,
          prices: {},
          open: "unknown",
          distance_km: result.dist ? Math.round(result.dist / 10) / 100 : 0,
          payment_methods: [],
        },
      ];
    });
  } catch {
    return null;
  }
}
