/**
 * Rest areas and overnight stops along major European corridors
 */

import type { Locale } from "@/lib/i18n/locale";
import { countryName } from "@/lib/geo/country-name";
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";

export interface RestArea {
  id: string;
  /** Latin or official name for non-Bulgarian locales */
  name: string;
  /** Bulgarian display name when it differs from `name` */
  name_bg?: string;
  location: Localized;
  corridor: string;
  country_code: string;
  facilities: string[];
  coords: { lng: number; lat: number };
  notes?: Localized;
}

export const EUROPEAN_REST_AREAS: RestArea[] = [
  {
    id: "rasthof-walserberg",
    name: "Rasthof Walserberg",
    location: {
      bg: "A1, граница DE-AT",
      en: "A1, DE-AT border",
      tr: "A1, DE-AT sınırı",
      ro: "A1, granița DE-AT",
    },
    corridor: "munich-sofia",
    country_code: "AT",
    facilities: ["parking", "toilet", "restaurant", "fuel", "shower"],
    coords: { lng: 12.989, lat: 47.793 },
    notes: {
      bg: "Идеална спирка преди/след границата DE-AT.",
      en: "Ideal stop before or after the DE-AT border.",
      tr: "DE-AT sınırından önce/sonra ideal durak.",
      ro: "Oprire ideală înainte sau după granița DE-AT.",
    },
  },
  {
    id: "rasthof-vocklabruck",
    name: "Rasthof Vöcklabruck",
    location: {
      bg: "A1, Австрия",
      en: "A1, Austria",
      tr: "A1, Avusturya",
      ro: "A1, Austria",
    },
    corridor: "munich-sofia",
    country_code: "AT",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 13.658, lat: 48.009 },
  },
  {
    id: "mol-m1-gyor",
    name: "MOL M1 Győr",
    location: {
      bg: "M1, Унгария",
      en: "M1, Hungary",
      tr: "M1, Macaristan",
      ro: "M1, Ungaria",
    },
    corridor: "munich-sofia",
    country_code: "HU",
    facilities: ["parking", "toilet", "restaurant", "fuel", "wifi"],
    coords: { lng: 17.635, lat: 47.687 },
    notes: {
      bg: "Голяма зона за почивка на пътя към Будапеща.",
      en: "Large rest area on the road to Budapest.",
      tr: "Budapeşte yolunda büyük dinlenme alanı.",
      ro: "Zonă mare de odihnă spre Budapesta.",
    },
  },
  {
    id: "m7-balaton",
    name: "M7 Balaton",
    location: {
      bg: "M7, езеро Балатон",
      en: "M7, Lake Balaton",
      tr: "M7, Balaton Gölü",
      ro: "M7, lacul Balaton",
    },
    corridor: "munich-sofia",
    country_code: "HU",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 17.75, lat: 46.92 },
  },
  {
    id: "nis-jug",
    name: "Niš motorway — south",
    name_bg: "АМ Ниш — юг",
    location: {
      bg: "E75, Ниш",
      en: "E75, Niš",
      tr: "E75, Niş",
      ro: "E75, Niš",
    },
    corridor: "munich-sofia",
    country_code: "RS",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 21.9, lat: 43.32 },
    notes: {
      bg: "Ключова спирка преди границата с България.",
      en: "Key stop before the border with Bulgaria.",
      tr: "Bulgaristan sınırından önce önemli durak.",
      ro: "Oprire importantă înainte de granița cu Bulgaria.",
    },
  },
  {
    id: "motelia-trakia",
    name: "Motel Trakia",
    name_bg: "Мотел Тракия",
    location: {
      bg: "АМ Тракия, км 120",
      en: "A1 Trakia, km 120",
      tr: "Trakya otoyolu, km 120",
      ro: "Autostrada Trakia, km 120",
    },
    corridor: "athens-sofia",
    country_code: "BG",
    facilities: ["parking", "toilet", "restaurant", "wifi"],
    coords: { lng: 24.2, lat: 42.3 },
  },
  {
    id: "hemus-rest",
    name: "Hemus rest area",
    name_bg: "Почивна станция Хемус",
    location: {
      bg: "АМ Хемус, км 85",
      en: "A2 Hemus, km 85",
      tr: "Hemus otoyolu, km 85",
      ro: "Autostrada Hemus, km 85",
    },
    corridor: "bucharest-sofia",
    country_code: "BG",
    facilities: ["parking", "toilet", "restaurant"],
    coords: { lng: 23.8, lat: 42.8 },
  },
  {
    id: "motel-e80",
    name: "Motel E-80",
    location: {
      bg: "Е-80, близо до Сливница",
      en: "E-80, near Slivnitsa",
      tr: "E-80, Slivnitsa yakını",
      ro: "E-80, lângă Slivnitsa",
    },
    corridor: "munich-sofia",
    country_code: "BG",
    facilities: ["parking", "toilet", "shower", "restaurant", "fuel"],
    coords: { lng: 23.0, lat: 42.7 },
  },
  {
    id: "aire-de-reims",
    name: "Aire de Reims",
    location: {
      bg: "A4, Франция",
      en: "A4, France",
      tr: "A4, Fransa",
      ro: "A4, Franța",
    },
    corridor: "paris-sofia",
    country_code: "FR",
    facilities: ["parking", "toilet", "restaurant", "fuel", "ev_charging"],
    coords: { lng: 4.03, lat: 49.26 },
  },
  {
    id: "rasthof-hamburg",
    name: "Rasthof Hamburg",
    location: {
      bg: "A7, Германия",
      en: "A7, Germany",
      tr: "A7, Almanya",
      ro: "A7, Germania",
    },
    corridor: "stockholm-sofia",
    country_code: "DE",
    facilities: ["parking", "toilet", "restaurant", "fuel", "shower"],
    coords: { lng: 10.0, lat: 53.55 },
  },
  {
    id: "bratislava-d2",
    name: "D2 Bratislava",
    location: {
      bg: "D2, Словакия",
      en: "D2, Slovakia",
      tr: "D2, Slovakya",
      ro: "D2, Slovacia",
    },
    corridor: "prague-sofia",
    country_code: "SK",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 17.15, lat: 48.15 },
  },
  {
    id: "rasthof-koln",
    name: "Rasthof Köln-Ost",
    location: {
      bg: "A3, Германия",
      en: "A3, Germany",
      tr: "A3, Almanya",
      ro: "A3, Germania",
    },
    corridor: "london-sofia",
    country_code: "DE",
    facilities: ["parking", "toilet", "restaurant", "fuel", "shower", "wifi"],
    coords: { lng: 7.05, lat: 50.96 },
  },
  {
    id: "calais-port",
    name: "Calais Port Area",
    location: {
      bg: "Кале, Франция",
      en: "Calais, France",
      tr: "Calais, Fransa",
      ro: "Calais, Franța",
    },
    corridor: "london-sofia",
    country_code: "FR",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 1.858, lat: 50.951 },
    notes: {
      bg: "Преди Eurotunnel / паром към Великобритания.",
      en: "Before Eurotunnel / ferry to the UK.",
      tr: "Eurotunnel / İngiltere feribotundan önce.",
      ro: "Înainte de Eurotunnel / feribot spre Marea Britanie.",
    },
  },
  {
    id: "thessaloniki-ring",
    name: "Thessaloniki rest area",
    name_bg: "Почивна зона Солун",
    location: {
      bg: "E90, Солун",
      en: "E90, Thessaloniki",
      tr: "E90, Selanik",
      ro: "E90, Salonic",
    },
    corridor: "athens-sofia",
    country_code: "GR",
    facilities: ["parking", "toilet", "restaurant", "fuel"],
    coords: { lng: 22.95, lat: 40.64 },
  },
];

export function restAreaName(locale: Locale, area: RestArea): string {
  if (locale === "bg" && area.name_bg) return area.name_bg;
  return area.name;
}

export function restAreaLocation(locale: Locale, area: RestArea): string {
  return pickText(locale, area.location);
}

export function restAreaCountry(locale: Locale, area: RestArea): string {
  return countryName(area.country_code, locale);
}

export function restAreaNotes(
  locale: Locale,
  area: RestArea
): string | undefined {
  if (!area.notes) return undefined;
  return pickText(locale, area.notes);
}

export function getRestAreasForCorridor(corridorId: string): RestArea[] {
  return EUROPEAN_REST_AREAS.filter((a) => a.corridor === corridorId);
}

export function getRestAreasByCountry(countryCode: string): RestArea[] {
  const code = countryCode.trim().toUpperCase();
  return EUROPEAN_REST_AREAS.filter(
    (a) => a.country_code.toUpperCase() === code
  );
}