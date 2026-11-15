import { haversineKm } from "@/lib/geo/haversine";
import type { AccidentPoint } from "@/lib/hotspots/types";

export const MVR_SOURCE_ID = "bg-mvr";

export const MVR_ATTRIBUTION =
  "Данни: МВР — Интерактивна карта на ПТП (mvr.bg)";

/** Same calendar day and about 100 m counts as the Cherna Pista point. */
export const MVR_DEDUPE_KM = 0.1;

export interface MvrRow {
  objectid: number;
  date: string;
  year: number;
  lng: number;
  lat: number;
  died: number;
  injured: number;
}

const CELL = 0.002;

/**
 * A row with deaths is fatal. Any other injury row is slight.
 * The layer does not split serious and slight injuries.
 */
export function mvrPoint(row: MvrRow): AccidentPoint | null {
  if (!Number.isFinite(row.lng) || !Number.isFinite(row.lat)) return null;
  if (row.lat < 40 || row.lat > 47 || row.lng < 21 || row.lng > 30) return null;
  const died = row.died > 0;
  const injured = row.injured > 0;
  if (!died && !injured) return null;
  const year = row.year || Number(row.date.slice(0, 4));
  if (!Number.isInteger(year) || year < 2021) return null;
  return {
    lng: row.lng,
    lat: row.lat,
    year,
    kind: died ? "fatal" : "slight",
    country: "BG",
    source_id: MVR_SOURCE_ID,
  };
}

/**
 * Drop an MVR row when Cherna Pista already has that day at nearly the same place.
 * Rows after Cherna's last day, and rows Cherna never recorded, stay.
 */
export function dedupeMvrRows(
  rows: MvrRow[],
  cherna: Array<{ date: string; lng: number; lat: number }>
): MvrRow[] {
  const index = new Map<string, Array<{ lng: number; lat: number }>>();
  for (const place of cherna) {
    const key = cellKey(place.date, place.lng, place.lat);
    const list = index.get(key);
    if (list) list.push(place);
    else index.set(key, [place]);
  }
  return rows.filter((row) => !matchesCherna(row, index));
}

function matchesCherna(
  row: MvrRow,
  index: Map<string, Array<{ lng: number; lat: number }>>
): boolean {
  const lngCell = Math.floor(row.lng / CELL);
  const latCell = Math.floor(row.lat / CELL);
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      const list = index.get(`${row.date}|${lngCell + dx}|${latCell + dy}`);
      if (!list) continue;
      for (const place of list) {
        if (haversineKm(row, place) <= MVR_DEDUPE_KM) return true;
      }
    }
  }
  return false;
}

function cellKey(date: string, lng: number, lat: number): string {
  return `${date}|${Math.floor(lng / CELL)}|${Math.floor(lat / CELL)}`;
}
