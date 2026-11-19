import type { RouteOptionSummary } from "@/lib/planner/types";

export type ComparePointCode =
  | "shorter_distance"
  | "shorter_total"
  | "shorter_drive"
  | "less_wait"
  | "fewer_tolls"
  | "fewer_vignettes"
  | "avoids_countries";

/** One thing that speaks for a road, as plain numbers and codes; the page words it. */
export interface ComparePoint {
  code: ComparePointCode;
  km?: number;
  min?: number;
  /** Country codes (tolls, vignettes, countries avoided). */
  codes?: string[];
}

const MIN_KM = 15;
const MIN_TOTAL_MIN = 15;
const MIN_DRIVE_MIN = 15;
const MIN_WAIT_MIN = 10;

function only(list: string[], other: string[]): string[] {
  const set = new Set(other);
  return list.filter((code) => !set.has(code));
}

/** What road `a` does better than road `b`. */
export function pointsOver(a: RouteOptionSummary, b: RouteOptionSummary): ComparePoint[] {
  const points: ComparePoint[] = [];
  const km = Math.round(b.distance_km - a.distance_km);
  if (km >= MIN_KM) points.push({ code: "shorter_distance", km });
  const total = Math.round(b.total_min - a.total_min);
  if (total >= MIN_TOTAL_MIN) points.push({ code: "shorter_total", min: total });
  const drive = Math.round(b.drive_min - a.drive_min);
  if (drive >= MIN_DRIVE_MIN && drive !== total) points.push({ code: "shorter_drive", min: drive });
  const wait = Math.round(b.wait_min - a.wait_min);
  if (wait >= MIN_WAIT_MIN) points.push({ code: "less_wait", min: wait });
  const tolls = only(b.toll_codes, a.toll_codes);
  if (tolls.length > 0) points.push({ code: "fewer_tolls", codes: tolls });
  const vignettes = only(b.vignette_codes, a.vignette_codes);
  if (vignettes.length > 0) points.push({ code: "fewer_vignettes", codes: vignettes });
  const avoided = only(b.countries, a.countries);
  if (avoided.length > 0) points.push({ code: "avoids_countries", codes: avoided });
  return points;
}
