import { haversineKm } from "@/lib/geo/haversine";
import { fetchEcontrolPrices } from "@/lib/fuel-prices/e-control";
import { fetchTankerkoenigPrices } from "@/lib/fuel-prices/tankerkoenig";
import type {
  KnownPrice,
  PriceDeps,
  PriceLookupResult,
  PriceQuery,
} from "@/lib/fuel-prices/types";

const STUB_COUNTRIES = new Set(["BG", "RS", "HU", "RO", "TR"]);
const MATCH_KM = 3;

/**
 * Austria uses E-Control. Germany uses Tankerkönig when a key is set.
 * Bulgaria, Serbia, Hungary, Romania and Turkey have no provider here.
 * A failure or a missing key returns null and "price unknown". No amount is guessed.
 */
export async function resolveStationPrice(
  query: PriceQuery,
  deps: PriceDeps = {}
): Promise<PriceLookupResult> {
  const country = query.countryCode?.toUpperCase() ?? "";
  if (STUB_COUNTRIES.has(country) || (country !== "AT" && country !== "DE")) {
    return unknown();
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? new Date();
  try {
    const prices =
      country === "AT"
        ? await fetchEcontrolPrices(query, { fetchImpl, now })
        : await germanPrices(query, {
            fetchImpl,
            now,
            apiKey: deps.tankerkoenigKey,
          });
    const nearest = closest(prices, query.lat, query.lng);
    if (!nearest) return unknown();
    return { price: nearest, reason: null };
  } catch {
    return unknown();
  }
}

async function germanPrices(
  query: PriceQuery,
  deps: { fetchImpl: typeof fetch; now: Date; apiKey?: string | null }
): Promise<KnownPrice[]> {
  const apiKey = (deps.apiKey ?? process.env.TANKERKOENIG_API_KEY)?.trim();
  if (!apiKey) return [];
  return fetchTankerkoenigPrices(query, { ...deps, apiKey });
}

function closest(
  prices: KnownPrice[],
  lat: number,
  lng: number
): KnownPrice | null {
  let best: { price: KnownPrice; distanceKm: number } | null = null;
  for (const price of prices) {
    const distanceKm = haversineKm(
      { lat, lng },
      { lat: price.lat, lng: price.lng }
    );
    if (distanceKm > MATCH_KM) continue;
    if (!best || distanceKm < best.distanceKm) best = { price, distanceKm };
  }
  return best?.price ?? null;
}

function unknown(): PriceLookupResult {
  return { price: null, reason: "price unknown" };
}
