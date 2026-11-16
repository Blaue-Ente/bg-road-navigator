import { catalog, type Locale } from "@/lib/i18n/locale";
import {
  PRODUCT_NAME_BG,
  PRODUCT_TAGLINE_BG,
} from "@/lib/i18n/locales/brand-names";

export function productName(locale: Locale): string {
  return locale === "bg" ? PRODUCT_NAME_BG : "BG Road Navigator";
}

export function productTagline(locale: Locale): string {
  return catalog(locale).brand.tagline;
}

/** @deprecated use productName("bg") */
export { PRODUCT_NAME_BG } from "@/lib/i18n/locales/brand-names";
/** @deprecated use productTagline("bg") */
export const PRODUCT_TAGLINE = PRODUCT_TAGLINE_BG;