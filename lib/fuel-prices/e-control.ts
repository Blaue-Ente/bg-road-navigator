import type { KnownPrice, PriceFuel } from "@/lib/fuel-prices/types";

const FUEL_CODE: Record<PriceFuel, string> = {
  diesel: "DIE",
  petrol: "SUP",
  lpg: "GAS",
};

interface EcontrolStation {
  name?: string;
  location?: { latitude?: number; longitude?: number };
  prices?: Array<{ fuelType?: string; amount?: number }>;
}

export function parseEcontrolStations(
  payload: unknown,
  fuel: PriceFuel,
  observedAt: string
): KnownPrice[] {
  if (!Array.isArray(payload)) return [];
  const code = FUEL_CODE[fuel];
  const prices: KnownPrice[] = [];
  for (const item of payload as EcontrolStation[]) {
    const lat = item.location?.latitude;
    const lng = item.location?.longitude;
    const amount = item.prices?.find(
      (price) => price.fuelType === code
    )?.amount;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)
      continue;
    prices.push({
      amount,
      currency: "EUR",
      unit: "L",
      source: "e-control",
      observedAt,
      stationName: item.name ?? null,
      brand: item.name ?? null,
      lat,
      lng,
    });
  }
  return prices;
}

export async function fetchEcontrolPrices(
  query: { fuel: PriceFuel; lat: number; lng: number },
  deps: { fetchImpl: typeof fetch; now: Date }
): Promise<KnownPrice[]> {
  const params = new URLSearchParams({
    latitude: String(query.lat),
    longitude: String(query.lng),
    fuelType: FUEL_CODE[query.fuel],
    includeClosed: "false",
  });
  const response = await deps.fetchImpl(
    `https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?${params}`,
    { headers: { Accept: "application/json" }, cache: "no-store" }
  );
  if (!response.ok) return [];
  const payload = (await response.json()) as unknown;
  return parseEcontrolStations(payload, query.fuel, deps.now.toISOString());
}
