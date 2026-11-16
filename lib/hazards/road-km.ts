import type { Locale } from "@/lib/i18n/locale";

/** Latin road reference for non-Bulgarian UI when the parser found a number. */
export function roadKmDisplay(
  roadKmBg: string | null,
  textBg: string,
  locale: Locale
): string | null {
  if (locale === "bg") return roadKmBg;
  const combined = roadKmBg ?? textBg;
  const romanRoad = combined.match(/\b([IVX]{1,4}-\d+)\b/i)?.[1];
  const km = combined.match(
    /(?:\u043A\u043C|km)\.?\s*(\d+(?:[+.]\d+)?)/i
  )?.[1];
  if (romanRoad && km) return `${romanRoad} km ${km}`;
  if (km) return `km ${km}`;
  return null;
}