import type { Locale } from "@/lib/i18n/locale";
import { localeTag } from "@/lib/i18n/locale";
import { countryNameBg } from "@/lib/geo/country-names-bg";

export function countryName(code: string, locale: Locale): string {
  const normalized = code.trim().toUpperCase();
  if (locale === "bg") {
    const fromTable = countryNameBg(normalized);
    if (fromTable !== normalized) return fromTable;
  }
  try {
    const name = new Intl.DisplayNames([localeTag(locale)], {
      type: "region",
    }).of(normalized);
    if (name && name !== normalized) return name;
  } catch {
    /* Intl may be unavailable in some runtimes */
  }
  return countryNameBg(normalized) ?? normalized;
}