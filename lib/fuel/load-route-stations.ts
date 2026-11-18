import { getFuelStations } from "@/lib/api-clients/tomtom-places";
import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import { fetchNakordoniFuelStations } from "@/lib/fuel-prices/nakordoni-fuel";
import { readPoiConfig } from "@/lib/poi/config";
import { fetchPoiNear } from "@/lib/poi/client";
import type { FuelStation } from "@/types/fuel.types";
import { addressFromTags, fuelTypesFromTags } from "@/lib/fuel/station-tags";
import { haversineKm } from "@/lib/geo/haversine";

export async function loadFuelStationsAt(
  lng: number,
  lat: number,
  radiusKm = 25
): Promise<FuelStation[]> {
  const config = readPoiConfig();
  if (config) {
    const collection = await fetchPoiNear(config, {
      lat,
      lon: lng,
      radiusM: Math.round(radiusKm * 1000),
      types: ["fuel"],
      limit: 30,
    });
    if (collection?.items.length) {
      return poiItemsToStations(collection.items, lat, lng);
    }
  }
  if (process.env.TOMTOM_API_KEY?.trim()) {
    return getFuelStations(lng, lat, radiusKm);
  }
  const cc = countryCodeAtPoint(lng, lat);
  if (cc && ["BG", "GR", "MK", "RO"].includes(cc)) {
    const priced = await fetchNakordoniFuelStations({
      lat,
      lng,
      countryCode: cc,
      limit: 20,
    });
    if (priced.length > 0) return priced;
  }
  return [];
}

function poiItemsToStations(
  items: Array<{
    id: string;
    name: string;
    brand: string | null;
    lat: number;
    lon: number;
    tags: Record<string, string>;
    dist_m: number | null;
  }>,
  refLat: number,
  refLng: number
): FuelStation[] {
  return items.map((item) => {
    const distance_km =
      item.dist_m != null
        ? Math.round((item.dist_m / 1000) * 10) / 10
        : haversineKm({ lat: refLat, lng: refLng }, { lat: item.lat, lng: item.lon });
    return {
      id: item.id,
      name: item.name,
      brand: item.brand ?? item.name,
      coords: { lat: item.lat, lng: item.lon },
      address: addressFromTags(item.tags),
      prices: {},
      open: "unknown",
      distance_km,
      payment_methods: [],
      ...(fuelTypesFromTags(item.tags).length > 0
        ? { fuel_types: fuelTypesFromTags(item.tags) }
        : {}),
      ...(item.tags.opening_hours ? { opening_hours: item.tags.opening_hours } : {}),
      ...((item.tags.phone ?? item.tags["contact:phone"])
        ? { phone: item.tags.phone ?? item.tags["contact:phone"] }
        : {}),
    };
  });
}

export function mergeFuelStationLists(batches: FuelStation[][]): FuelStation[] {
  const seen = new Set<string>();
  const out: FuelStation[] = [];
  for (const batch of batches) {
    for (const station of batch) {
      const key =
        station.id || `${station.coords.lng.toFixed(4)},${station.coords.lat.toFixed(4)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(station);
    }
  }
  return out.sort((a, b) => a.distance_km - b.distance_km);
}