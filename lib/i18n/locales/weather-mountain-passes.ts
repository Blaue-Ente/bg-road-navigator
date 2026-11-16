import { haversineKm } from "@/lib/geo/haversine";
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";
import type { Locale } from "@/lib/i18n/locale";

export const WEATHER_MOUNTAIN_PASSES: Array<{
  names: Localized;
  lng: number;
  lat: number;
}> = [
  {
    names: {
      bg: "Шипченски проход",
      en: "Shipka Pass",
      tr: "Şipka Geçidi",
      ro: "Trecătoarea Șipka",
    },
    lng: 25.323,
    lat: 42.748,
  },
  {
    names: {
      bg: "Предела",
      en: "Predel Pass",
      tr: "Predel Geçidi",
      ro: "Trecătoarea Predel",
    },
    lng: 23.407,
    lat: 41.897,
  },
  {
    names: {
      bg: "Петрохан",
      en: "Petrohan Pass",
      tr: "Petrohan Geçidi",
      ro: "Trecătoarea Petrohan",
    },
    lng: 23.125,
    lat: 43.118,
  },
  {
    names: {
      bg: "Троянски проход",
      en: "Troyan Pass",
      tr: "Troyan Geçidi",
      ro: "Trecătoarea Troyan",
    },
    lng: 24.676,
    lat: 42.778,
  },
];

export function nearbyPassNames(
  points: Array<{ lng: number; lat: number }>,
  radiusKm = 35,
  locale: Locale = "bg"
): string[] {
  const names: string[] = [];
  for (const pass of WEATHER_MOUNTAIN_PASSES) {
    if (points.some((p) => haversineKm(p, pass) <= radiusKm)) {
      names.push(pickText(locale, pass.names));
    }
  }
  return names;
}