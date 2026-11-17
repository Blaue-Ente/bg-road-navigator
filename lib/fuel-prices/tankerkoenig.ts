import { cachedValue, minutesFromEnv, snapToGrid } from "@/lib/cache/shared-cache";
import { haversineKm } from "@/lib/geo/haversine";
import type { KnownPrice, PriceFuel } from "@/lib/fuel-prices/types";

const FIELD: Record<PriceFuel, "diesel" | "e5" | null> = {
  diesel: "diesel",
  petrol: "e5",
  lpg: null,
};

interface TankerStation {
  name?: string;
  brand?: string;
  lat?: number;
  lng?: number;
  diesel?: number | null;
  e5?: number | null;
}

export function parseTankerkoenigStations(
  payload: unknown,
  fuel: PriceFuel,
  observedAt: string
): KnownPrice[] {
  const field = FIELD[fuel];
  if (!field || !payload || typeof payload !== "object") return [];
  const body = payload as { ok?: boolean; stations?: TankerStation[] };
  if (body.ok === false || !Array.isArray(body.stations)) return [];
  const prices: KnownPrice[] = [];
  for (const station of body.stations) {
    const amount = station[field];
    if (typeof station.lat !== "number" || typeof station.lng !== "number")
      continue;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)
      continue;
    prices.push({
      amount,
      currency: "EUR",
      unit: "L",
      source: "tankerkoenig",
      observedAt,
      stationName: station.name ?? null,
      brand: station.brand ?? null,
      lat: station.lat,
      lng: station.lng,
    });
  }
  return prices;
}

/** Cells of about 5 km: drivers on similar routes share one stored answer. */
const CELL_DEG = 0.05;
const CELL_MARGIN_KM = 4;
const RADIUS_KM = 8;

/**
 * Prices at German stations near a point. Tankerkönig is open data (CC BY 4.0)
 * and asks not to be polled often, so each 5 km cell is kept (shared through
 * the database) for TANKERKOENIG_CACHE_MINUTES, default 10. The observation
 * time stays the time of the real call, so a stale price is not shown as fresh.
 */
export async function fetchTankerkoenigPrices(
  query: { fuel: PriceFuel; lat: number; lng: number },
  deps: { fetchImpl: typeof fetch; now: Date; apiKey: string }
): Promise<KnownPrice[]> {
  if (!FIELD[query.fuel]) return [];
  const cellLat = snapToGrid(query.lat, CELL_DEG);
  const cellLng = snapToGrid(query.lng, CELL_DEG);
  const { value } = await cachedValue<KnownPrice[]>({
    key: `tanker|${query.fuel}|${cellLat.toFixed(2)}|${cellLng.toFixed(2)}`,
    kind: "tankerkoenig",
    ttlMs: minutesFromEnv(process.env.TANKERKOENIG_CACHE_MINUTES, 10, 120) * 60_000,
    persist: true,
    load: () => fetchLive({ ...query, lat: cellLat, lng: cellLng }, deps),
  });
  return (value ?? []).filter(
    (price) =>
      haversineKm({ lat: query.lat, lng: query.lng }, { lat: price.lat, lng: price.lng }) <=
      RADIUS_KM
  );
}

/** One live call around the cell centre. Null on failure, so it is never kept. */
async function fetchLive(
  query: { fuel: PriceFuel; lat: number; lng: number },
  deps: { fetchImpl: typeof fetch; now: Date; apiKey: string }
): Promise<KnownPrice[] | null> {
  const params = new URLSearchParams({
    lat: String(query.lat),
    lng: String(query.lng),
    rad: String(RADIUS_KM + CELL_MARGIN_KM),
    sort: "dist",
    type: "all",
    apikey: deps.apiKey,
  });
  try {
    const response = await deps.fetchImpl(
      `https://creativecommons.tankerkoenig.de/json/list.php?${params}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as unknown;
    return parseTankerkoenigStations(payload, query.fuel, deps.now.toISOString());
  } catch {
    return null;
  }
}
