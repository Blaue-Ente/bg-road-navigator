import { and, eq, gt, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { fuelPriceReports } from "@/lib/db/schema";

export interface FuelReportRow {
  id: string;
  station_id: string;
  fuel_type: string;
  price: number;
  currency: "EUR";
  photo_url: string | null;
  reported_at: string;
  expires_at: string;
  reporter_id: string;
}

export async function insertFuelReport(input: {
  stationId: string;
  fuelType: string;
  price: number;
  photoUrl: string | null;
  reporterId: string;
  now?: Date;
}): Promise<FuelReportRow> {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const db = getDb();
  const [row] = await db
    .insert(fuelPriceReports)
    .values({
      stationId: input.stationId,
      fuelType: input.fuelType,
      price: input.price,
      photoUrl: input.photoUrl,
      reporterId: input.reporterId,
      reportedAt: now,
      expiresAt,
    })
    .returning();
  if (!row) throw new Error("Fuel report insert returned no row");
  return toReport(row);
}

export async function listValidFuelReports(
  stationIds: string[],
  fuelType: string,
  now = new Date()
): Promise<FuelReportRow[]> {
  if (stationIds.length === 0) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(fuelPriceReports)
    .where(
      and(
        inArray(fuelPriceReports.stationId, stationIds.slice(0, 200)),
        eq(fuelPriceReports.fuelType, fuelType),
        gt(fuelPriceReports.expiresAt, now)
      )
    );
  return rows.map(toReport);
}

function toReport(row: typeof fuelPriceReports.$inferSelect): FuelReportRow {
  return {
    id: row.id,
    station_id: row.stationId,
    fuel_type: row.fuelType,
    price: row.price,
    currency: "EUR",
    photo_url: row.photoUrl,
    reported_at: row.reportedAt.toISOString(),
    expires_at: row.expiresAt.toISOString(),
    reporter_id: row.reporterId,
  };
}
