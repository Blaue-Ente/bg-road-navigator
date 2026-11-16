import type { Locale } from "@/lib/i18n/locale";

/** Optional per-locale copy on data rows; falls back to Bulgarian (`*_bg`) fields. */
export type LocalizedMap = Partial<Record<Locale, string>>;

/** All four locale strings required on curated data rows. */
export type Localized = Record<Locale, string>;

export function pickText(locale: Locale, text: Localized | LocalizedMap): string {
  const value = text[locale]?.trim();
  if (value) return value;
  return text.bg?.trim() || "";
}

/** Optional per-locale copy on data rows; falls back to Bulgarian (`*_bg`) fields. */
export function pickI18nText(
  locale: Locale,
  options: {
    i18n?: LocalizedMap;
    bg: string;
    en?: string;
  }
): string {
  const fromMap = options.i18n?.[locale]?.trim();
  if (fromMap) return fromMap;
  if (locale !== "bg" && options.en?.trim()) return options.en.trim();
  return options.bg;
}

export function pickI18nNotes(
  locale: Locale,
  options: {
    notes_i18n?: LocalizedMap;
    notes_bg?: string;
    notes_en?: string;
  }
): string | undefined {
  const fromMap = options.notes_i18n?.[locale]?.trim();
  if (fromMap) return fromMap;
  if (locale === "en" && options.notes_en?.trim()) return options.notes_en.trim();
  const fromLocalized =
    options.notes_i18n &&
    pickText(locale, options.notes_i18n as LocalizedMap);
  if (fromLocalized) return fromLocalized;
  return options.notes_bg?.trim() || undefined;
}