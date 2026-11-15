import type { Locale } from "@/lib/i18n/locale";

/** Optional per-locale copy on data rows; falls back to Bulgarian (`*_bg`) fields. */
export type LocalizedMap = Partial<Record<Locale, string>>;

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
  if (locale === "en" && options.en?.trim()) return options.en.trim();
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
  return options.notes_bg?.trim() || undefined;
}