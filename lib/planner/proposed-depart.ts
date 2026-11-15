import { toDatetimeLocalValue } from "@/lib/planner/form-preferences";

const SOFIA_TZ = "Europe/Sofia";

/** Next 08:00 in Europe/Sofia as a datetime-local value. Tomorrow if today's 08:00 has passed. */
export function proposedDepartLocalValue(now = new Date()): string {
  const { year, month, day } = sofiaYmd(now);
  let candidate = sofiaLocalToDate(year, month, day, 8, 0);
  if (candidate.getTime() <= now.getTime()) {
    const next = addDays(year, month, day, 1);
    candidate = sofiaLocalToDate(next.year, next.month, next.day, 8, 0);
  }
  return toDatetimeLocalValue(candidate.toISOString());
}

export function formatDepartLocaleDisplay(
  departLocal: string,
  locale = "bg-BG"
): string | null {
  if (!departLocal.trim()) return null;
  const date = new Date(departLocal);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: SOFIA_TZ,
  }).format(date);
}

function sofiaYmd(at: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SOFIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  return { year, month, day };
}

function sofiaLocalToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const guess = new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00.000Z`
  );
  const offset = sofiaOffsetMinutes(guess);
  return new Date(guess.getTime() - offset * 60_000);
}

function sofiaOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SOFIA_TZ,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const match = raw.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const mins = Number(match[3] ?? "0");
  return sign * (hours * 60 + mins);
}

function addDays(year: number, month: number, day: number, delta: number) {
  const utc = Date.UTC(year, month - 1, day + delta);
  const d = new Date(utc);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}