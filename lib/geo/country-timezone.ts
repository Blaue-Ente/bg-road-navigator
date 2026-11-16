/** IANA zone for overnight wake (08:00 local). Fallback is Sofia. */
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";
import { catalog, type Locale } from "@/lib/i18n/locale";

const COUNTRY_TIME_ZONE: Record<string, string> = {
  AT: "Europe/Vienna",
  BE: "Europe/Brussels",
  BG: "Europe/Sofia",
  CH: "Europe/Zurich",
  CZ: "Europe/Prague",
  DE: "Europe/Berlin",
  DK: "Europe/Copenhagen",
  ES: "Europe/Madrid",
  FI: "Europe/Helsinki",
  FR: "Europe/Paris",
  GB: "Europe/London",
  GR: "Europe/Athens",
  HR: "Europe/Zagreb",
  HU: "Europe/Budapest",
  IT: "Europe/Rome",
  MK: "Europe/Skopje",
  NL: "Europe/Amsterdam",
  PL: "Europe/Warsaw",
  RO: "Europe/Bucharest",
  RS: "Europe/Belgrade",
  SI: "Europe/Ljubljana",
  SK: "Europe/Bratislava",
  TR: "Europe/Istanbul",
};

const DEFAULT_TZ = "Europe/Sofia";

export function timeZoneForCountry(code: string | null | undefined): string {
  if (!code) return DEFAULT_TZ;
  return COUNTRY_TIME_ZONE[code.toUpperCase()] ?? DEFAULT_TZ;
}

const ZONE_LABEL: Record<string, Localized> = {
  "Europe/Sofia": {
    bg: "София",
    en: "Sofia",
    tr: "Sofya",
    ro: "Sofia",
  },
  "Europe/Budapest": {
    bg: "Будапеща",
    en: "Budapest",
    tr: "Budapeşte",
    ro: "Budapesta",
  },
  "Europe/Vienna": {
    bg: "Виена",
    en: "Vienna",
    tr: "Viyana",
    ro: "Viena",
  },
  "Europe/Belgrade": {
    bg: "Белград",
    en: "Belgrade",
    tr: "Belgrad",
    ro: "Belgrad",
  },
  "Europe/Istanbul": {
    bg: "Истанбул",
    en: "Istanbul",
    tr: "İstanbul",
    ro: "Istanbul",
  },
  "Europe/Berlin": {
    bg: "Мюнхен/Берлин",
    en: "Munich/Berlin",
    tr: "Münih/Berlin",
    ro: "München/Berlin",
  },
  "Europe/Paris": {
    bg: "Париж",
    en: "Paris",
    tr: "Paris",
    ro: "Paris",
  },
  "Europe/Bucharest": {
    bg: "Букурещ",
    en: "Bucharest",
    tr: "Bükreş",
    ro: "București",
  },
  "Europe/Athens": {
    bg: "Атина",
    en: "Athens",
    tr: "Atina",
    ro: "Atena",
  },
  "Europe/Zagreb": {
    bg: "Загреб",
    en: "Zagreb",
    tr: "Zagreb",
    ro: "Zagreb",
  },
  "Europe/Bratislava": {
    bg: "Братислава",
    en: "Bratislava",
    tr: "Bratislava",
    ro: "Bratislava",
  },
  "Europe/Prague": {
    bg: "Прага",
    en: "Prague",
    tr: "Prag",
    ro: "Praga",
  },
  "Europe/Warsaw": {
    bg: "Варшава",
    en: "Warsaw",
    tr: "Varşova",
    ro: "Varșovia",
  },
  "Europe/Rome": {
    bg: "Рим",
    en: "Rome",
    tr: "Roma",
    ro: "Roma",
  },
  "Europe/Amsterdam": {
    bg: "Амстердам",
    en: "Amsterdam",
    tr: "Amsterdam",
    ro: "Amsterdam",
  },
  "Europe/Brussels": {
    bg: "Брюксел",
    en: "Brussels",
    tr: "Brüksel",
    ro: "Bruxelles",
  },
  "Europe/Zurich": {
    bg: "Цюрих",
    en: "Zurich",
    tr: "Zürih",
    ro: "Zürich",
  },
  "Europe/Ljubljana": {
    bg: "Любляна",
    en: "Ljubljana",
    tr: "Ljubljana",
    ro: "Ljubljana",
  },
  "Europe/Skopje": {
    bg: "Скопие",
    en: "Skopje",
    tr: "Üsküp",
    ro: "Skopje",
  },
  "Europe/London": {
    bg: "Лондон",
    en: "London",
    tr: "Londra",
    ro: "Londra",
  },
  "Europe/Madrid": {
    bg: "Мадрид",
    en: "Madrid",
    tr: "Madrid",
    ro: "Madrid",
  },
  "Europe/Copenhagen": {
    bg: "Копенхаген",
    en: "Copenhagen",
    tr: "Kopenhag",
    ro: "Copenhaga",
  },
  "Europe/Helsinki": {
    bg: "Хелзинки",
    en: "Helsinki",
    tr: "Helsinki",
    ro: "Helsinki",
  },
};

export function timeZoneLabel(timeZone: string, locale: Locale = "bg"): string {
  const row = ZONE_LABEL[timeZone];
  if (row) return pickText(locale, row);
  if (locale === "bg") return ZONE_LABEL_BG_FALLBACK[timeZone] ?? "местно време";
  return catalog(locale).planner.timeZone.local;
}

/** @deprecated Use timeZoneLabel(zone, locale) */
export function timeZoneLabelBg(timeZone: string): string {
  return timeZoneLabel(timeZone, "bg");
}

const ZONE_LABEL_BG_FALLBACK: Record<string, string> = {
  "Europe/Sofia": "София",
  "Europe/Budapest": "Будапеща",
  "Europe/Vienna": "Виена",
  "Europe/Belgrade": "Белград",
  "Europe/Istanbul": "Истанбул",
  "Europe/Berlin": "Мюнхен/Берлин",
  "Europe/Paris": "Париж",
  "Europe/Bucharest": "Букурещ",
  "Europe/Athens": "Атина",
  "Europe/Zagreb": "Загреб",
  "Europe/Bratislava": "Братислава",
  "Europe/Prague": "Прага",
  "Europe/Warsaw": "Варшава",
  "Europe/Rome": "Рим",
  "Europe/Amsterdam": "Амстердам",
  "Europe/Brussels": "Брюксел",
  "Europe/Zurich": "Цюрих",
  "Europe/Ljubljana": "Любляна",
  "Europe/Skopje": "Скопие",
  "Europe/London": "Лондон",
  "Europe/Madrid": "Мадрид",
  "Europe/Copenhagen": "Копенхаген",
  "Europe/Helsinki": "Хелзинки",
};