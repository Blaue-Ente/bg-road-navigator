import { toDatetimeLocalValue } from "@/lib/planner/form-preferences";

/** Next 08:00 on the device clock as a datetime-local value. Tomorrow if today's 08:00 has passed. */
export function proposedDepartLocalValue(now = new Date()): string {
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMilliseconds(0);
  candidate.setHours(8, 0, 0, 0);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
    candidate.setHours(8, 0, 0, 0);
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
  }).format(date);
}

export function formatDepartInTimeZone(
  departLocal: string,
  locale: string,
  timeZone: string
): string | null {
  if (!departLocal.trim()) return null;
  const date = new Date(departLocal);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(date);
}