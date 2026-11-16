import type { FueloFuel } from "@/lib/fuel-prices/fuelo";
import {
  FUELO_CRON_COUNTRIES,
  fetchFueloAverageCached,
} from "@/lib/fuel-prices/fuelo-data-cache";

export { FUELO_CRON_COUNTRIES } from "@/lib/fuel-prices/fuelo-data-cache";

export const FUELO_MIN_GAP_MS = 13_000;

export interface FueloRefreshReport {
  ok: boolean;
  requests: number;
  stored: number;
  skipped: number;
  errors: number;
}

/** Warms Next.js data-cache entries (same URLs readers use). */
export async function refreshFueloAverages(deps?: {
  fetchImpl?: typeof fetch;
  apiKey?: string;
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
      const row = await fetchFueloAverageCached(country, fuel, {
        fetchImpl: deps?.fetchImpl,
        apiKey,
      });
      if (row) stored += 1;
      else errors += 1;
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