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

export async function fetchTankerkoenigPrices(
  query: { fuel: PriceFuel; lat: number; lng: number },
  deps: { fetchImpl: typeof fetch; now: Date; apiKey: string }
): Promise<KnownPrice[]> {
  if (!FIELD[query.fuel]) return [];
  const params = new URLSearchParams({
    lat: String(query.lat),
    lng: String(query.lng),
    rad: "8",
    sort: "dist",
    type: "all",
    apikey: deps.apiKey,
  });
  const response = await deps.fetchImpl(
    `https://creativecommons.tankerkoenig.de/json/list.php?${params}`,
    { headers: { Accept: "application/json" }, cache: "no-store" }
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as unknown;
  return parseTankerkoenigStations(payload, query.fuel, deps.now.toISOString());
}
