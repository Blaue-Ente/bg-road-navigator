/**
 * Major European border checkpoints (beyond Bulgaria)
 */

import type { BorderCrossing } from "@/lib/constants/border-crossings";

const DEFAULT_HOURLY = Array(24).fill(25);

export const EUROPEAN_BORDER_CROSSINGS: BorderCrossing[] = [
  {
    id: "calais",
    name_bg: "Кале — Фолкстън",
    name_en: "Calais — Folkestone",
    country_pair: "FR - GB",
    region: "western",
    coords: { lng: 1.8587, lat: 50.9513 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 8 && h <= 20 ? 45 : 20)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза (ако е нужна)"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус"],
    notes_bg: "Eurotunnel / паром. Резервирайте предварително.",
  },
  {
    id: "kehl-strasbourg",
    name_bg: "Кел — Страсбург",
    name_en: "Kehl — Strasbourg",
    country_pair: "DE - FR",
    region: "western",
    coords: { lng: 7.811, lat: 48.574 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 15),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница DE-FR по A5.",
  },
  {
    id: "suben",
    name_bg: "Зубен — Пфратен",
    name_en: "Suben — Pfarrkirchen",
    country_pair: "DE - AT",
    region: "central",
    coords: { lng: 13.225, lat: 48.418 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 10),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Основна граница Германия — Австрия.",
  },
  {
    id: "nickelsdorf",
    name_bg: "Никелсдорф — Хегешалом",
    name_en: "Nickelsdorf — Hegyeshalom",
    country_pair: "AT - HU",
    region: "central",
    coords: { lng: 17.068, lat: 47.542 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 14 && h <= 22 ? 35 : 15)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус"],
    notes_bg: "Натоварена граница AT-HU. Пик в петък.",
  },
  {
    id: "batrovci",
    name_bg: "Батровци — Безка",
    name_en: "Batrovci — Bezka",
    country_pair: "HR - RS",
    region: "balkans",
    coords: { lng: 19.071, lat: 45.045 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 10 && h <= 18 ? 40 : 20)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Транзит Хърватия — Сърбия.",
  },
  {
    id: "horgos",
    name_bg: "Хоргош — Рöszke",
    name_en: "Horgos — Röszke",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 19.978, lat: 46.183 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 12 && h <= 20 ? 50 : 25)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Главна граница Сърбия — Унгария.",
  },
  {
    id: "frankfurt-oder",
    name_bg: "Франкфурт (Одер) — Слубице",
    name_en: "Frankfurt Oder — Slubice",
    country_pair: "DE - PL",
    region: "central",
    coords: { lng: 14.55, lat: 52.347 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 18),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Германия — Полша.",
  },
  {
    id: "krakovets",
    name_bg: "Краковец — Медика",
    name_en: "Krakovets — Medyka",
    country_pair: "UA - PL",
    region: "eastern",
    coords: { lng: 23.015, lat: 49.958 },
    nakordoni_ppid: "id_13",
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 8 && h <= 20 ? 90 : 45)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус"],
    notes_bg: "Граница Украйна — Полша. Дълги опашки.",
  },
  {
    id: "gorizia",
    name_bg: "Гориция — Нова Горица",
    name_en: "Gorizia — Nova Gorica",
    country_pair: "IT - SI",
    region: "southern",
    coords: { lng: 13.646, lat: 45.959 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 12),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил"],
    notes_bg: "Граница Италия — Словения.",
  },
];

export type EuropeanBorderRegion =
  | "all"
  | "bulgaria"
  | "balkans"
  | "central"
  | "western"
  | "southern"
  | "eastern"
  | "route";

import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";

export function getAllEuropeanCrossings(): BorderCrossing[] {
  return [
    ...BORDER_CROSSINGS.map((c) => ({ ...c, region: c.region ?? "bulgaria" })),
    ...EUROPEAN_BORDER_CROSSINGS,
  ];
}

export function getCrossingsByRegion(region: EuropeanBorderRegion): BorderCrossing[] {
  const all = getAllEuropeanCrossings();
  if (region === "all") return all;
  if (region === "bulgaria") return all.filter((c) => (c.region ?? "bulgaria") === "bulgaria");
  if (region === "route") return all;
  return all.filter((c) => c.region === region);
}

export function getNonBulgarianCrossings(): BorderCrossing[] {
  return getAllEuropeanCrossings().filter((c) => (c.region ?? "bulgaria") !== "bulgaria");
}

export function getCrossingsForCorridor(corridorId: string): BorderCrossing[] {
  const corridor = TRAVEL_CORRIDORS.find((c) => c.id === corridorId);
  if (!corridor) return [];
  const idSet = new Set(corridor.borderIds);
  return getAllEuropeanCrossings().filter((c) => idSet.has(c.id));
}

export function getCrossingsByIds(ids: string[]): BorderCrossing[] {
  const idSet = new Set(ids);
  return getAllEuropeanCrossings().filter((c) => idSet.has(c.id));
}
