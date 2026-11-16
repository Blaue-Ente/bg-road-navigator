/**
 * Fuelo country averages via Next.js shared data cache (24 h revalidate).
 * Not DB persistence — see Fuelo ToS (developers.fuelo.net/terms, 2026-11-16).
 */
import {
  fueloAuthHeaders,
  parseFueloAverage,
  type FueloAverage,
  type FueloFuel,
} from "@/lib/fuel-prices/fuelo";

export const FUELO_ROOT = "https://api.fuelo.net";
export const FUELO_REVALIDATE_SEC = 86_400;
export const FUELO_CACHE_TAG = "fuelo-avg";

/** Corridor countries — diesel + petrol ≈ 10 calls/day on the free plan. */
export const FUELO_CRON_COUNTRIES = [
  "bg",
  "de",
  "at",
  "hu",
  "ro",
  "gr",
  "rs",
  "tr",
  "mk",
] as const;

const cronCountrySet = new Set(
  FUELO_CRON_COUNTRIES.map((c) => c.toUpperCase())
);

export function isFueloCronCountry(countryCode: string): boolean {
  return cronCountrySet.has(countryCode.trim().toUpperCase());
}

export function fueloAverageUrl(country: string, fuel: FueloFuel): string {
  const fuelParam = fuel === "petrol95" ? "petrol" : fuel;
  return `${FUELO_ROOT}/v2/prices/average?country=${encodeURIComponent(country.toLowerCase())}&fuel=${encodeURIComponent(fuelParam)}`;
}

export type FueloCachedFetchDeps = {
  fetchImpl?: typeof fetch;
  apiKey?: string;
};

/** One live Fuelo call per (country, fuel) per revalidate window, shared across serverless instances. */
export async function fetchFueloAverageCached(
  country: string,
  fuel: FueloFuel,
  deps: FueloCachedFetchDeps = {}
): Promise<FueloAverage | null> {
  const apiKey = (deps.apiKey ?? process.env.FUELO_API_KEY ?? "").trim();
  if (!apiKey) return null;
  const url = fueloAverageUrl(country, fuel);
  try {
    const response = await (deps.fetchImpl ?? fetch)(url, {
      headers: fueloAuthHeaders(apiKey),
      signal: AbortSignal.timeout(12_000),
      next: { revalidate: FUELO_REVALIDATE_SEC, tags: [FUELO_CACHE_TAG] },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: unknown };
    return parseFueloAverage(payload.data);
  } catch {
    return null;
  }
}

/** Reader path: only cron-listed countries; fail-open on miss/error. */
export async function readFueloAverageCached(
  countryCode: string,
  fuel: FueloFuel,
  deps?: FueloCachedFetchDeps
): Promise<FueloAverage | null> {
  if (!isFueloCronCountry(countryCode)) return null;
  return fetchFueloAverageCached(countryCode, fuel, deps);
}