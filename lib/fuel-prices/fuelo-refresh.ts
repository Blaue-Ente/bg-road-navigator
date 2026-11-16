import {
  fetchFueloAverage,
  type FueloFuel,
} from "@/lib/fuel-prices/fuelo";
import { writeFueloAverage } from "@/lib/fuel-prices/fuelo-cache";

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

export const FUELO_MIN_GAP_MS = 13_000;

export interface FueloRefreshReport {
  ok: boolean;
  requests: number;
  stored: number;
  skipped: number;
  errors: number;
}

export async function refreshFueloAverages(deps?: {
  fetchImpl?: typeof fetch;
  apiKey?: string;
  now?: Date;
  sleep?: (ms: number) => Promise<void>;
  countries?: readonly string[];
}): Promise<FueloRefreshReport> {
  const apiKey = deps?.apiKey ?? process.env.FUELO_API_KEY ?? "";
  const sleep = deps?.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  if (!apiKey.trim()) {
    return { ok: false, requests: 0, stored: 0, skipped: 0, errors: 0 };
  }
  let requests = 0;
  let stored = 0;
  let errors = 0;
  const fuels: FueloFuel[] = ["diesel", "petrol"];
  const countries = deps?.countries ?? FUELO_CRON_COUNTRIES;
  for (const country of countries) {
    for (const fuel of fuels) {
      if (requests > 0) await sleep(FUELO_MIN_GAP_MS);
      requests += 1;
      const result = await fetchFueloAverage(country, fuel, {
        fetchImpl: deps?.fetchImpl,
        apiKey,
      });
      if (result.ok && result.data) {
        writeFueloAverage(result.data, fuel, deps?.now?.getTime());
        stored += 1;
      } else {
        errors += 1;
      }
    }
  }
  return {
    ok: stored > 0,
    requests,
    stored,
    skipped: 0,
    errors,
  };
}