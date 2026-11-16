import { nakordoniMeteredFetch } from "@/lib/api-clients/nakordoni";
import type { FuelPrices, FuelStation } from "@/types/fuel.types";
import type { PriceFuel } from "@/lib/fuel-prices/types";

export const NAKORDONI_FUEL_MARKETS = new Set(["BG", "GR", "MK", "RO"]);
export const NAKORDONI_FUEL_CACHE_MS = 24 * 60 * 60 * 1000;

const fuelResponseCache = new Map<
  string,
  { json: unknown; expiresAt: number }
>();

export function clearNakordoniFuelCacheForTests() {
  fuelResponseCache.clear();
}

const GRADE_MAP: Record<PriceFuel, string> = {
  diesel: "diesel",
  petrol: "petrol95",
  lpg: "lpg",
};

export interface NakordoniFuelStationRow {
  id?: string;
  name?: string;
  brand?: string | null;
  address?: string;
  lat?: number;
  lng?: number;
  distance_km?: number;
  prices?: Record<
    string,
    { price?: number; currency?: string; stale?: boolean }
  >;
}

export function parseNakordoniFuelStations(
  payload: unknown,
  refLat: number,
  refLng: number
): FuelStation[] {
  if (!payload || typeof payload !== "object") return [];
  const body = payload as {
    ok?: boolean;
    data?: { stations?: NakordoniFuelStationRow[] };
    stations?: NakordoniFuelStationRow[];
  };
  const rows = body.data?.stations ?? body.stations ?? [];
  if (!Array.isArray(rows)) return [];
  const out: FuelStation[] = [];
  for (const row of rows) {
    const lat = row.lat;
    const lng = row.lng;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const prices: FuelPrices = {};
    for (const [grade, entry] of Object.entries(row.prices ?? {})) {
      const amount = entry?.price;
      if (typeof amount !== "number" || !Number.isFinite(amount)) continue;
      if (grade === "diesel") prices.diesel = amount;
      else if (grade === "petrol95" || grade === "petrol" || grade === "petrol95plus")
        prices.petrol95 = amount;
      else if (grade === "lpg") prices.lpg = amount;
    }
    const distance_km =
      typeof row.distance_km === "number" && Number.isFinite(row.distance_km)
        ? row.distance_km
        : haversineKm(refLat, refLng, lat, lng);
    out.push({
      id: row.id ?? `nk-${lat.toFixed(5)},${lng.toFixed(5)}`,
      name: row.name?.trim() || row.brand?.trim() || "Fuel",
      brand: row.brand?.trim() || row.name?.trim() || "—",
      coords: { lat, lng },
      address: row.address,
      prices,
      open: "unknown",
      distance_km,
      payment_methods: [],
    });
  }
  return out;
}

export async function fetchNakordoniFuelStations(input: {
  lat: number;
  lng: number;
  countryCode: string;
  fuel?: PriceFuel;
  limit?: number;
}): Promise<FuelStation[]> {
  const cc = input.countryCode.toUpperCase();
  if (!NAKORDONI_FUEL_MARKETS.has(cc)) return [];
  const fuelType = GRADE_MAP[input.fuel ?? "diesel"];
  const limit = input.limit ?? 15;
  const path = `/api/v2/data/fuel-stations?lat=${encodeURIComponent(String(input.lat))}&lon=${encodeURIComponent(String(input.lng))}&country=${encodeURIComponent(cc)}&fuel_type=${encodeURIComponent(fuelType)}&limit=${limit}`;
  const cacheKey = path;
  const now = Date.now();
  const cached = fuelResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return parseNakordoniFuelStations(cached.json, input.lat, input.lng);
  }
  const result = await nakordoniMeteredFetch(path);
  if (!result.ok) return [];
  fuelResponseCache.set(cacheKey, {
    json: result.json,
    expiresAt: now + NAKORDONI_FUEL_CACHE_MS,
  });
  return parseNakordoniFuelStations(result.json, input.lat, input.lng);
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}