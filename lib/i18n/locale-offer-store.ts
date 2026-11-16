import { LOCALE_STORAGE_KEY } from "@/lib/i18n/locale";
import {
  localeOffer,
  readLocaleOfferDismissed,
  type OfferLocale,
} from "@/lib/i18n/suggest-locale";

const listeners = new Set<() => void>();

export function notifyLocaleOfferChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeLocaleOffer(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function readBrowserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  if (navigator.languages?.length) return navigator.languages;
  return navigator.language ? [navigator.language] : [];
}

function readStoredLocaleRaw(): string | null {
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readLocaleOfferList(): OfferLocale[] | null {
  if (typeof window === "undefined") return null;
  return localeOffer({
    stored: readStoredLocaleRaw(),
    dismissed: readLocaleOfferDismissed(),
    browserLanguages: readBrowserLanguages(),
  });
}