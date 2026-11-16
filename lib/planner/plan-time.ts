import { timeZoneLabel } from "@/lib/geo/country-timezone";
import type { Locale } from "@/lib/i18n/locale";
import { localeTag } from "@/lib/i18n/locale";

/** Wall-clock label for a plan instant in a given IANA zone. */
export function formatPlanInstant(
  iso: string,
  locale: Locale,
  timeZone?: string | null
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const when = new Intl.DateTimeFormat(localeTag(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
  if (!timeZone) return when;
  return `${when} (${timeZoneLabel(timeZone, locale)})`;
}