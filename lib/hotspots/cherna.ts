import type { AccidentKind, AccidentPoint } from "@/lib/hotspots/types";

/** Cherna Pista publishes the MVR extract under this credit. */
export const CHERNA_SOURCE_ID = "bg-cherna";

export interface ChernaPlace {
  date: string;
  lng: number;
  lat: number;
}

export interface ChernaParse {
  points: AccidentPoint[];
  /** Injury and fatal points that have a calendar date, used to skip MVR duplicates. */
  places: ChernaPlace[];
  rows: number;
  withCoordinates: number;
  datedFrom: string | null;
  datedTo: string | null;
}

/**
 * Injury and fatal rows from the Cherna Pista CSV.
 * `y`/`x` are WGS84 latitude/longitude with a comma decimal.
 * `died=да` is fatal. `injured=да` is slight, because the file does not split injury.
 * Property-only rows and rows without coordinates stay out.
 */
export function parseChernaCsv(csv: string): ChernaParse {
  const text = csv.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/);
  const header = (lines[0] ?? "").split(";").map((cell) => cell.trim());
  const column = {
    year: header.indexOf("year"),
    date: header.indexOf("date"),
    y: header.indexOf("y"),
    x: header.indexOf("x"),
    injured: header.indexOf("injured"),
    died: header.indexOf("died"),
  };
  const points: AccidentPoint[] = [];
  const places: ChernaPlace[] = [];
  let rows = 0;
  let withCoordinates = 0;
  let datedFrom: string | null = null;
  let datedTo: string | null = null;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || !line.trim()) continue;
    const cells = line.split(";");
    rows += 1;
    const iso = isoDate(cell(cells, column.date));
    if (iso && (!datedFrom || iso < datedFrom)) datedFrom = iso;
    if (iso && (!datedTo || iso > datedTo)) datedTo = iso;

    const kind = chernaKind(
      cell(cells, column.injured),
      cell(cells, column.died)
    );
    if (!kind) continue;
    const lat = coordinate(cell(cells, column.y));
    const lng = coordinate(cell(cells, column.x));
    if (lat == null || lng == null) continue;
    withCoordinates += 1;
    if (lat < 40 || lat > 47 || lng < 21 || lng > 30) continue;
    const year = yearOf(cell(cells, column.year), iso);
    if (year < 2021) continue;
    points.push({
      lng,
      lat,
      year,
      kind,
      country: "BG",
      source_id: CHERNA_SOURCE_ID,
    });
    if (iso) places.push({ date: iso, lng, lat });
  }

  return { points, places, rows, withCoordinates, datedFrom, datedTo };
}

export function chernaKind(injured: string, died: string): AccidentKind | null {
  if (died.trim().toLowerCase() === "да") return "fatal";
  if (injured.trim().toLowerCase() === "да") return "slight";
  return null;
}

function cell(cells: string[], index: number): string {
  if (index < 0) return "";
  return cells[index] ?? "";
}

function coordinate(value: string): number | null {
  const text = value.trim().replace(",", ".");
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function yearOf(yearCell: string, iso: string | null): number {
  const parsed = Number(yearCell.trim());
  if (Number.isInteger(parsed) && parsed > 1900) return parsed;
  if (!iso) return 0;
  return Number(iso.slice(0, 4));
}

/** `D.M.YYYY` from the MVR extract, or null when the cell is not a date. */
function isoDate(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
