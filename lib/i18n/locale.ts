import { bg } from "@/lib/i18n/locales/bg";
import { en } from "@/lib/i18n/locales/en";
import { ro } from "@/lib/i18n/locales/ro";
import { tr } from "@/lib/i18n/locales/tr";
import type { MessageCatalog, Messages } from "@/lib/i18n/locales/bg";

export const LOCALES = ["bg", "en", "tr", "ro"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = "bg-road-locale";
export const LOCALE_COOKIE = "bg-road-locale";

export const LOCALE_NATIVE_NAME: Record<Locale, string> = {
  bg: "Български",
  en: "English",
  tr: "Türkçe",
  ro: "Română",
};

const catalogs: Record<Locale, MessageCatalog> = { bg, en, tr, ro };

type MessageTree = { [key: string]: string | MessageTree };

function isMessageTree(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-fill missing leaves from Bulgarian so untranslated catalogs never surface raw keys. */
function mergeWithBg(fallback: MessageTree, chosen: MessageTree): MessageTree {
  const merged: MessageTree = { ...fallback };
  for (const key of Object.keys(chosen)) {
    const chosenVal = chosen[key];
    const fallbackVal = fallback[key];
    if (typeof chosenVal === "string") {
      merged[key] = chosenVal.trim() ? chosenVal : fallbackVal ?? "";
    } else if (isMessageTree(chosenVal)) {
      const fb = isMessageTree(fallbackVal) ? fallbackVal : {};
      merged[key] = mergeWithBg(fb, chosenVal);
    }
  }
  return merged;
}

export function parseLocale(value: unknown): Locale {
  return value === "en" || value === "tr" || value === "ro" ? value : "bg";
}

export function catalog(locale: Locale): MessageCatalog {
  if (locale === "bg") return catalogs.bg;
  return mergeWithBg(catalogs.bg, catalogs[locale]) as MessageCatalog;
}

const LOCALE_TAGS: Record<Locale, string> = {
  bg: "bg-BG",
  en: "en-GB",
  tr: "tr-TR",
  ro: "ro-RO",
};

export function localeTag(locale: Locale): string {
  return LOCALE_TAGS[locale];
}

/** BCP-47 tag for Valhalla turn-by-turn language. */
export function valhallaLanguage(locale: Locale): string {
  return LOCALE_TAGS[locale];
}

export function writeLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}