import { catalog, type Locale } from "@/lib/i18n/locale";

export function productName(locale: Locale): string {
  return locale === "bg" ? "БГ Навигатор" : "BG Road Navigator";
}

export function productTagline(locale: Locale): string {
  return catalog(locale).brand.tagline;
}

/** @deprecated use productName("bg") */
export const PRODUCT_NAME = "БГ Навигатор";
/** @deprecated use productTagline("bg") */
export const PRODUCT_TAGLINE =
  "Пътен помощник за българи в Европа";