import { notifyLocaleOfferChanged } from "@/lib/i18n/locale-offer-store";

export const LOCALE_OFFER_STORAGE_KEY = "bg-road-locale-offer";

const OFFER_LOCALES = ["en", "tr", "ro"] as const;
export type OfferLocale = (typeof OFFER_LOCALES)[number];

function isOfferLocale(prefix: string): prefix is OfferLocale {
  return prefix === "en" || prefix === "tr" || prefix === "ro";
}

/** Order to offer, or null when no offer should be shown. Never returns "bg". */
export function localeOffer(input: {
  stored: string | null;
  dismissed: boolean;
  browserLanguages: readonly string[];
}): OfferLocale[] | null {
  if (input.stored !== null || input.dismissed) return null;

  const primary = input.browserLanguages[0]?.toLowerCase() ?? "";
  if (primary.startsWith("bg")) return null;

  const matched: OfferLocale[] = [];
  const seen = new Set<OfferLocale>();

  for (const lang of input.browserLanguages) {
    const prefix = lang.split("-")[0]?.toLowerCase() ?? "";
    if (!isOfferLocale(prefix) || seen.has(prefix)) continue;
    matched.push(prefix);
    seen.add(prefix);
  }

  for (const loc of OFFER_LOCALES) {
    if (!seen.has(loc)) matched.push(loc);
  }

  return matched;
}

export function readLocaleOfferDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LOCALE_OFFER_STORAGE_KEY) === "dismissed";
  } catch {
    return false;
  }
}

export function dismissLocaleOffer(): void {
  try {
    localStorage.setItem(LOCALE_OFFER_STORAGE_KEY, "dismissed");
  } catch {
    /* storage unavailable */
  }
  notifyLocaleOfferChanged();
}