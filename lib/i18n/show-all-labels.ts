import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import { pluralRo } from "@/lib/i18n/plural";

/** Collapsed road-note rows (n ≥ 2). */
export function showAllRoadNotesLabel(count: number, locale: Locale): string {
  if (count < 2) return "";
  const s = catalog(locale).sheet;
  if (locale === "ro") {
    const tpl =
      pluralRo(count) === "many"
        ? s.showAllRoadNotesRoMany
        : s.showAllRoadNotesRoFew;
    return formatTemplate(tpl, { count: String(count) });
  }
  if (locale === "tr") {
    return formatTemplate(s.showAllRoadNotesTr, { count: String(count) });
  }
  return formatTemplate(s.showAllRoadNotesOther, { count: String(count) });
}

/** Collapsed weather segments (n ≥ 2). */
export function showAllWeatherLabel(count: number, locale: Locale): string {
  if (count < 2) return "";
  const s = catalog(locale).sheet;
  if (locale === "ro") {
    const tpl =
      pluralRo(count) === "many"
        ? s.showAllWeatherRoMany
        : s.showAllWeatherRoFew;
    return formatTemplate(tpl, { count: String(count) });
  }
  if (locale === "tr") {
    return formatTemplate(s.showAllWeatherTr, { count: String(count) });
  }
  return formatTemplate(s.showAllWeatherOther, { count: String(count) });
}