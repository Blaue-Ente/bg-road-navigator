/**
 * Major European border checkpoints (beyond Bulgaria)
 */

import type { BorderCrossing } from "@/lib/constants/border-crossings";
import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";

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
    id: "kiefersfelden",
    name_bg: "Киферсфелден — Куфщайн",
    name_en: "Kiefersfelden — Kufstein",
    country_pair: "DE - AT",
    region: "central",
    coords: { lng: 12.17, lat: 47.633 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 14 && h <= 20 ? 25 : 12)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Алтернатива на Зубен — A93 към Мюнхен.",
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
    id: "komarno",
    name_bg: "Комарно — Комаром",
    name_en: "Komarno — Komarom",
    country_pair: "SK - HU",
    region: "central",
    coords: { lng: 18.128, lat: 47.746 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 15),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Словакия — Унгария. Маршрут през Братислава.",
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
    id: "bajakovo",
    name_bg: "Баяково — Шид",
    name_en: "Bajakovo — Sid",
    country_pair: "HR - RS",
    region: "balkans",
    coords: { lng: 19.228, lat: 45.044 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 11 && h <= 19 ? 35 : 18)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Алтернатива на Батровци — по-бърз за Загреб.",
  },
  {
    id: "obrezje",
    name_bg: "Обрежие — Брегана",
    name_en: "Obrezje — Bregana",
    country_pair: "SI - HR",
    region: "balkans",
    coords: { lng: 15.688, lat: 45.895 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 12),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Словения — Хърватия.",
  },
  {
    id: "gorican",
    name_bg: "Горичан — Летене",
    name_en: "Gorican — Letenye",
    country_pair: "HR - HU",
    region: "balkans",
    coords: { lng: 16.678, lat: 46.295 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 12 && h <= 20 ? 30 : 15)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Хърватия — Унгария.",
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
    id: "presevo",
    name_bg: "Прешево — Табановце",
    name_en: "Presevo — Tabanovce",
    country_pair: "RS - MK",
    region: "balkans",
    coords: { lng: 21.712, lat: 42.252 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 10 && h <= 18 ? 40 : 20)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Сърбия — С. Македония.",
  },
  {
    id: "liubotenet",
    name_bg: "Люботен — Калафат",
    name_en: "Liubotenet — Calafat",
    country_pair: "RO - BG",
    region: "balkans",
    coords: { lng: 22.934, lat: 43.991 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 9 && h <= 17 ? 35 : 20)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Дунав мост Калafat — Видин.",
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
    id: "terespol",
    name_bg: "Тереспол — Брест",
    name_en: "Terespol — Brest",
    country_pair: "PL - BY",
    region: "eastern",
    coords: { lng: 23.615, lat: 52.075 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 8 && h <= 20 ? 60 : 30)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Полша — Беларус. Виза задължителна.",
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
  {
    id: "chiasso",
    name_bg: "Киасо — Комо",
    name_en: "Chiasso — Como",
    country_pair: "CH - IT",
    region: "southern",
    coords: { lng: 9.031, lat: 45.833 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 16 && h <= 20 ? 25 : 10)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Швейцария — Италия. Винетка CH.",
  },
  {
    id: "mont-blanc",
    name_bg: "Тунел Монблан",
    name_en: "Mont Blanc Tunnel",
    country_pair: "FR - IT",
    region: "southern",
    coords: { lng: 6.912, lat: 45.923 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 10 && h <= 18 ? 30 : 15)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Тунел FR-IT. Тол такса, резервация в пик.",
  },
  {
    id: "kipi",
    name_bg: "Кипи — Ипсала",
    name_en: "Kipi — Ipsala",
    country_pair: "GR - TR",
    region: "balkans",
    coords: { lng: 26.298, lat: 41.065 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 10 && h <= 18 ? 55 : 30)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион"],
    notes_bg: "Граница Гърция — Турция. Алтернатива на Капитан Андреево.",
  },
  {
    id: "roscoff",
    name_bg: "Роскоф — Плимут",
    name_en: "Roscoff — Plymouth",
    country_pair: "FR - GB",
    region: "western",
    coords: { lng: -3.987, lat: 48.727 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) => (h >= 7 && h <= 19 ? 40 : 20)),
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Автобус"],
    notes_bg: "Паром за Югозападна Англия. Резервирайте билет.",
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
