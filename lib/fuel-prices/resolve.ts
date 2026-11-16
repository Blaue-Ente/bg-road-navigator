import { haversineKm } from "@/lib/geo/haversine";
import { fetchEcontrolPrices } from "@/lib/fuel-prices/e-control";
import {
  fetchNakordoniFuelStations,
  NAKORDONI_FUEL_MARKETS,
} from "@/lib/fuel-prices/nakordoni-fuel";
import { fetchTankerkoenigPrices } from "@/lib/fuel-prices/tankerkoenig";
import type {
  KnownPrice,
  PriceDeps,
  PriceLookupResult,
  PriceQuery,
  PriceFuel,
} from "@/lib/fuel-prices/types";

const STUB_COUNTRIES = new Set(["RS", "HU", "TR"]);
const MATCH_KM = 3;

/**
 * Austria: E-Control. Germany: Tankerkönig when a key is set.
 * BG, GR, MK, RO: Nakordoni fuel-stations (metered, licensed markets only).
 * Missing keys or errors fail open to "price unknown".
 */
export async function resolveStationPrice(
  query: PriceQuery,
  deps: PriceDeps = {}
): Promise<PriceLookupResult> {
  const country = query.countryCode?.toUpperCase() ?? "";
  if (STUB_COUNTRIES.has(country)) {
    return unknown();
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? new Date();
  try {
    if (country === "AT") {
      const prices = await fetchEcontrolPrices(query, { fetchImpl, now });
      const nearest = closest(prices, query.lat, query.lng);
      if (!nearest) return unknown();
      return { price: nearest, reason: null };
    }
    if (country === "DE") {
      const prices = await germanPrices(query, {
        fetchImpl,
        now,
        apiKey: deps.tankerkoenigKey,
      });
      const nearest = closest(prices, query.lat, query.lng);
      if (!nearest) return unknown();
      return { price: nearest, reason: null };
    }
    if (NAKORDONI_FUEL_MARKETS.has(country)) {
      const fromNakordoni = await nakordoniPrice(query);
      if (fromNakordoni) return { price: fromNakordoni, reason: null };
    }
    return unknown();
  } catch {
    return unknown();
  }
}

async function nakordoniPrice(query: PriceQuery): Promise<KnownPrice | null> {
  const countryCode = query.countryCode ?? "";
  if (!countryCode) return null;
  const stations = await fetchNakordoniFuelStations({
    lat: query.lat,
    lng: query.lng,
    countryCode,
    fuel: query.fuel,
    limit: 10,
  });
  const field = nakordoniField(query.fuel);
  let best: KnownPrice | null = null;
  let bestKm = MATCH_KM + 1;
  for (const station of stations) {
    const amount = station.prices[field];
    if (typeof amount !== "number" || !Number.isFinite(amount)) continue;
    const distanceKm = haversineKm(
      { lat: query.lat, lng: query.lng },
      station.coords
    );
    if (distanceKm > MATCH_KM) continue;
    const price: KnownPrice = {
      amount,
      currency: "EUR",
      unit: "L",
      source: "nakordoni",
      observedAt: new Date().toISOString(),
      stationName: station.name,
      brand: station.brand,
      lat: station.coords.lat,
      lng: station.coords.lng,
    };
    if (distanceKm < bestKm) {
      best = price;
      bestKm = distanceKm;
    }
  }
  return best;
}

function nakordoniField(fuel: PriceFuel): "diesel" | "petrol95" | "lpg" {
  if (fuel === "petrol") return "petrol95";
  if (fuel === "lpg") return "lpg";
  return "diesel";
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
