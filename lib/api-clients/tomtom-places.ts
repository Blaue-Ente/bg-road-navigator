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

export async function getFuelStations(
  lng: number,
  lat: number,
  radiusKm = 30
): Promise<FuelStation[]> {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) return [];

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
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as TomTomPoiResponse;
    return (payload.results ?? []).flatMap((result) => {
      const position = result.position;
      if (
        typeof position?.lat !== "number" ||
        typeof position.lon !== "number"
      ) {
        return [];
      }

      const name = result.poi?.name ?? "Бензиностанция";
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
    return [];
  }
}
