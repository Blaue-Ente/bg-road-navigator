import { isDatabaseConfigured } from "@/lib/db";
import {
  downloadOilBulletin,
  parseOilBulletin,
} from "@/lib/fuel-prices/oil-bulletin";
import { upsertNationalAverages } from "@/lib/fuel-prices/national-store";

export interface BulletinRefreshReport {
  ok: boolean;
  source: "ec-oil-bulletin";
  week: string | null;
  rows: number;
  stored: number;
  bulgaria: { petrol: number | null; diesel: number | null };
  error?: string;
}

export async function refreshFuelBulletin(deps?: {
  fetchImpl?: typeof fetch;
  now?: Date;
}): Promise<BulletinRefreshReport> {
  const now = deps?.now ?? new Date();
  const downloaded = await downloadOilBulletin({
    fetchImpl: deps?.fetchImpl,
    now,
  });
  if (!downloaded) {
    return empty("Bulletin download failed.");
  }
  const rows = parseOilBulletin(
    downloaded.body,
    downloaded.contentType,
    downloaded.week
  );
  if (rows.length === 0) {
    return empty("Bulletin has no recognised prices.");
  }
  const bulgaria = {
    petrol: rows.find((row) => row.countryCode === "BG" && row.fuel === "petrol")
      ?.eurPerLitre ?? null,
    diesel: rows.find((row) => row.countryCode === "BG" && row.fuel === "diesel")
      ?.eurPerLitre ?? null,
  };
  let stored = 0;
  if (isDatabaseConfigured()) {
    stored = await upsertNationalAverages(rows, now);
  } else {
    await upsertNationalAverages(rows, now);
  }
  return {
    ok: true,
    source: "ec-oil-bulletin",
    week: rows[0]?.week ?? downloaded.week,
    rows: rows.length,
    stored,
    bulgaria,
  };
}

function empty(error: string): BulletinRefreshReport {
  return {
    ok: false,
    source: "ec-oil-bulletin",
    week: null,
    rows: 0,
    stored: 0,
    bulgaria: { petrol: null, diesel: null },
    error,
  };
}
