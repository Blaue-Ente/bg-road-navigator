/**
 * In-process Fuelo average cache only — Fuelo ToS do not clearly permit DB persistence
 * for a public-facing app (§7 developers.fuelo.net/terms, checked 2026-11-16).
 */
import type { FueloAverage, FueloFuel } from "@/lib/fuel-prices/fuelo";

export const FUELO_SOURCE = "fuelo" as const;
export const FUELO_CACHE_MS = 24 * 60 * 60 * 1000;

const store = new Map<string, { row: FueloAverage; expiresAt: number }>();

export function fueloCacheKey(country: string, fuel: FueloFuel): string {
  return `${country.toUpperCase()}:${fuel}`;
}

export function clearFueloCacheForTests() {
  store.clear();
}

export function readFueloAverage(
  country: string,
  fuel: FueloFuel,
  now = Date.now()
): FueloAverage | null {
  const hit = store.get(fueloCacheKey(country, fuel));
  if (!hit || hit.expiresAt <= now) return null;
  return hit.row;
}

export function writeFueloAverage(
  row: FueloAverage,
  fuel: FueloFuel,
  fetchedAt = Date.now()
): void {
  const key = fueloCacheKey(row.country || "?", fuel);
  store.set(key, { row, expiresAt: fetchedAt + FUELO_CACHE_MS });
}

export function listFueloAverages(now = Date.now()): FueloAverage[] {
  const rows: FueloAverage[] = [];
  for (const hit of store.values()) {
    if (hit.expiresAt > now) rows.push(hit.row);
  }
  return rows;
}