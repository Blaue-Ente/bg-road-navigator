import {
  readLatestAverageDetails,
  type StoredAverage,
} from "@/lib/fuel-prices/national-store";
import { readFueloAverage } from "@/lib/fuel-prices/fuelo-cache";
import { FUELO_AVERAGE_SOURCE } from "@/lib/fuel-prices/present";
import type { FueloFuel } from "@/lib/fuel-prices/fuelo";

const bulletinFuelToFuelo: Record<"petrol" | "diesel", FueloFuel> = {
  petrol: "petrol",
  diesel: "diesel",
};

/** EC bulletin first; Fuelo in-memory cache fills gaps (see Fuelo ToS — no DB persist). */
export async function readMergedAverageDetails(
  countries: string[],
  fuel: "petrol" | "diesel"
): Promise<Map<string, StoredAverage & { source: "ec-oil-bulletin" | "fuelo" }>> {
  const bulletin = await readLatestAverageDetails(countries, fuel);
  const merged = new Map<
    string,
    StoredAverage & { source: "ec-oil-bulletin" | "fuelo" }
  >();
  for (const [code, row] of bulletin) {
    merged.set(code, { ...row, source: "ec-oil-bulletin" });
  }
  const fueloFuel = bulletinFuelToFuelo[fuel];
  for (const code of countries) {
    const cc = code.toUpperCase();
    if (merged.has(cc)) continue;
    const fuelo = readFueloAverage(cc, fueloFuel);
    if (!fuelo) continue;
    merged.set(cc, {
      price: fuelo.price,
      week: fuelo.date,
      source: FUELO_AVERAGE_SOURCE,
    });
  }
  return merged;
}