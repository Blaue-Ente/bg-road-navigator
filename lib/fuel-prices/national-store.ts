import { and, eq, inArray } from "drizzle-orm";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { fuelNationalAverages } from "@/lib/db/schema";
import type { BulletinPrice } from "@/lib/fuel-prices/oil-bulletin";
import { FUELO_AVERAGE_SOURCE, OIL_BULLETIN_SOURCE } from "@/lib/fuel-prices/present";

const SOURCE = OIL_BULLETIN_SOURCE;
const memory = new Map<string, { week: string; price: number }>();

export interface StoredAverage {
  price: number;
  week: string;
  source: typeof OIL_BULLETIN_SOURCE | typeof FUELO_AVERAGE_SOURCE;
}

export function clearAveragesForTests() {
  memory.clear();
}

export async function upsertNationalAverages(
  rows: BulletinPrice[],
  fetchedAt: Date
): Promise<number> {
  if (!isDatabaseConfigured() || rows.length === 0) {
    remember(rows);
    return 0;
  }
  const db = getDb();
  for (const row of rows) {
    await db
      .insert(fuelNationalAverages)
      .values({
        countryCode: row.countryCode,
        fuel: row.fuel,
        priceEurPerL: row.eurPerLitre,
        week: row.week,
        source: SOURCE,
        fetchedAt,
      })
      .onConflictDoUpdate({
        target: [
          fuelNationalAverages.countryCode,
          fuelNationalAverages.fuel,
          fuelNationalAverages.week,
          fuelNationalAverages.source,
        ],
        set: {
          priceEurPerL: row.eurPerLitre,
          fetchedAt,
        },
      });
  }
  remember(rows);
  return rows.length;
}

export async function readLatestAverageDetails(
  countries: string[],
  fuel: "petrol" | "diesel"
): Promise<Map<string, StoredAverage>> {
  const wanted = [...new Set(countries.map((code) => code.toUpperCase()))];
  const best = new Map<string, { week: string; price: number }>();
  for (const country of wanted) {
    const hit = memory.get(`${country}:${fuel}`);
    if (hit) best.set(country, hit);
  }
  if (isDatabaseConfigured() && wanted.length > 0) {
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(fuelNationalAverages)
        .where(
          and(
            eq(fuelNationalAverages.fuel, fuel),
            eq(fuelNationalAverages.source, SOURCE),
            inArray(fuelNationalAverages.countryCode, wanted)
          )
        );
      for (const row of rows) {
        const current = best.get(row.countryCode);
        if (!current || row.week >= current.week) {
          best.set(row.countryCode, {
            week: row.week,
            price: row.priceEurPerL,
          });
        }
      }
    } catch {
      // The in-memory copy still answers this process.
    }
  }
  const details = new Map<string, StoredAverage>();
  for (const [country, value] of best) {
    memory.set(`${country}:${fuel}`, value);
    details.set(country, {
      price: value.price,
      week: value.week,
      source: SOURCE,
    });
  }
  return details;
}

export async function readLatestAverages(
  countries: string[],
  fuel: "petrol" | "diesel"
): Promise<Map<string, number>> {
  const details = await readLatestAverageDetails(countries, fuel);
  const prices = new Map<string, number>();
  for (const [country, value] of details) prices.set(country, value.price);
  return prices;
}

function remember(rows: BulletinPrice[]) {
  for (const row of rows) {
    const key = `${row.countryCode}:${row.fuel}`;
    const current = memory.get(key);
    if (!current || row.week >= current.week) {
      memory.set(key, { week: row.week, price: row.eurPerLitre });
    }
  }
}
