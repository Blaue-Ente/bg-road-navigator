/**
 * Major European border checkpoints (beyond Bulgaria)
 */

import type { BorderCrossing } from "@/lib/constants/border-crossings";
import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import { EUROPEAN_BORDER_NOTES } from "@/lib/constants/european-border-notes";
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
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 8 && h <= 20 ? 45 : 20
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Eurotunnel / паром. Резервирайте предварително.",
    notes: EUROPEAN_BORDER_NOTES["calais"],
    document_codes: ["passport","visa_if_needed"],
    vehicle_codes: ["car","truck","bus"],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница DE-FR по A5.",
    notes: EUROPEAN_BORDER_NOTES["kehl-strasbourg"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Основна граница Германия — Австрия.",
    notes: EUROPEAN_BORDER_NOTES["suben"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "kiefersfelden",
    name_bg: "Киферсфелден — Куфщайн",
    name_en: "Kiefersfelden — Kufstein",
    country_pair: "DE - AT",
    region: "central",
    coords: { lng: 12.17, lat: 47.633 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 14 && h <= 20 ? 25 : 12
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Алтернатива на Зубен — A93 към Мюнхен.",
    notes: EUROPEAN_BORDER_NOTES["kiefersfelden"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "nickelsdorf",
    name_bg: "Никелсдорф — Хегешалом",
    name_en: "Nickelsdorf — Hegyeshalom",
    country_pair: "AT - HU",
    region: "central",
    coords: { lng: 17.068, lat: 47.542 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 14 && h <= 22 ? 35 : 15
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Натоварена граница AT-HU. Пик в петък.",
    notes: EUROPEAN_BORDER_NOTES["nickelsdorf"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck","bus"],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Словакия — Унгария. Маршрут през Братислава.",
    notes: EUROPEAN_BORDER_NOTES["komarno"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Германия — Полша.",
    notes: EUROPEAN_BORDER_NOTES["frankfurt-oder"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "batrovci",
    name_bg: "Батровци — Безка",
    name_en: "Batrovci — Bezka",
    country_pair: "HR - RS",
    region: "balkans",
    coords: { lng: 19.071, lat: 45.045 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 10 && h <= 18 ? 40 : 20
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Транзит Хърватия — Сърбия.",
    notes: EUROPEAN_BORDER_NOTES["batrovci"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "bajakovo",
    name_bg: "Баяково — Шид",
    name_en: "Bajakovo — Sid",
    country_pair: "HR - RS",
    region: "balkans",
    coords: { lng: 19.228, lat: 45.044 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 11 && h <= 19 ? 35 : 18
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Алтернатива на Батровци — по-бърз за Загреб.",
    notes: EUROPEAN_BORDER_NOTES["bajakovo"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Словения — Хърватия.",
    notes: EUROPEAN_BORDER_NOTES["obrezje"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "gorican",
    name_bg: "Горичан — Летене",
    name_en: "Gorican — Letenye",
    country_pair: "HR - HU",
    region: "balkans",
    coords: { lng: 16.678, lat: 46.295 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 12 && h <= 20 ? 30 : 15
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Хърватия — Унгария.",
    notes: EUROPEAN_BORDER_NOTES["gorican"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "horgos",
    name_bg: "Хоргош — Рьоске (магистрала)",
    name_en: "Horgoš — Röszke motorway",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 19.978, lat: 46.183 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 12 && h <= 20 ? 50 : 25
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Магистрала A1/E75, Сърбия — Унгария.",
    notes: EUROPEAN_BORDER_NOTES["horgos"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "horgos-road",
    name_bg: "Хоргош — Рьоске (път)",
    name_en: "Horgoš — Röszke road",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 19.992, lat: 46.166 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 12 && h <= 20 ? 40 : 20
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Стар път до магистралния пункт. Без тежкотоварен трафик.",
    notes: EUROPEAN_BORDER_NOTES["horgos-road"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car"],
  },
  {
    id: "tompa",
    name_bg: "Томпа — Келебия",
    name_en: "Tompa — Kelebia",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 19.539, lat: 46.206 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 10 && h <= 18 ? 35 : 20
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Международен пункт Сърбия — Унгария, западно от Хоргош.",
    notes: EUROPEAN_BORDER_NOTES["tompa"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "hercegszanto",
    name_bg: "Херцегсанто — Бачки Брег",
    name_en: "Hercegszántó — Bački Breg",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 18.941, lat: 45.946 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 10 && h <= 18 ? 30 : 15
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Западен пункт Сърбия — Унгария към Бая.",
    notes: EUROPEAN_BORDER_NOTES["hercegszanto"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "asotthalom",
    name_bg: "Асотхалом — Бачки Виногради",
    name_en: "Ásotthalom — Bački Vinogradi",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 19.79, lat: 46.199 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 20),
    working_hours: "07:00 - 22:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Ограничен пункт. Не е алтернатива за транзитен маршрут.",
    notes: EUROPEAN_BORDER_NOTES["asotthalom"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car"],
  },
  {
    id: "bacsalmas",
    name_bg: "Бачалмаш — Баймок",
    name_en: "Bácsalmás — Bajmok",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 19.326, lat: 46.126 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 20),
    working_hours: "07:00 - 19:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Ограничен пункт. Не е алтернатива за транзитен маршрут.",
    notes: EUROPEAN_BORDER_NOTES["bacsalmas"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car"],
  },
  {
    id: "bacsszentgyorgy",
    name_bg: "Бачсентдьорд — Ращина",
    name_en: "Bácsszentgyörgy — Raština",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 19.04, lat: 45.97 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 15),
    working_hours: "07:00 - 19:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Ограничен пункт. Не е алтернатива за транзитен маршрут.",
    notes: EUROPEAN_BORDER_NOTES["bacsszentgyorgy"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car"],
  },
  {
    id: "kubehaza",
    name_bg: "Кюбехаза — Рабе",
    name_en: "Kübekháza — Rabe",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 20.148, lat: 46.151 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 15),
    working_hours: "07:00 - 19:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Ограничен пункт. Не е алтернатива за транзитен маршрут.",
    notes: EUROPEAN_BORDER_NOTES["kubehaza"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car"],
  },
  {
    id: "tiszasziget",
    name_bg: "Тисасигет — Джала",
    name_en: "Tiszasziget — Đala",
    country_pair: "RS - HU",
    region: "balkans",
    coords: { lng: 20.173, lat: 46.166 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 15),
    working_hours: "07:00 - 19:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Ограничен пункт. Не е алтернатива за транзитен маршрут.",
    notes: EUROPEAN_BORDER_NOTES["tiszasziget"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car"],
  },
  {
    id: "presevo",
    name_bg: "Прешево — Табановце",
    name_en: "Presevo — Tabanovce",
    country_pair: "RS - MK",
    region: "balkans",
    coords: { lng: 21.712, lat: 42.252 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 10 && h <= 18 ? 40 : 20
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Сърбия — С. Македония.",
    notes: EUROPEAN_BORDER_NOTES["presevo"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "nadlac",
    name_bg: "Надлак II — Надлак",
    name_en: "Nadlac II — Nădlac",
    name_i18n: {
      en: "Nadlac II — Nădlac",
      tr: "Nadlac II — Nădlac",
      ro: "Nădlac II — Nădlac",
    },
    country_pair: "HU - RO",
    region: "central",
    coords: { lng: 20.752, lat: 46.068 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 0),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck","bus"],
    notes: {
      bg: "Основен А1 между Унгария и Румъня. Няма данни за чакане в приложението.",
      en: "Main A1 between Hungary and Romania. No wait data in the app.",
      tr: "Macaristan ile Romanya arasında A1. Uygulamada bekleme verisi yok.",
      ro: "A1 principal între Ungaria și România. Fără date de așteptare în aplicație.",
    },
    notes_bg: "Основен А1 между Унгария и Румъня. Няма данни за чакане в приложението.",
  },
  {
    id: "bors",
    name_bg: "Борш — Ártánd",
    name_en: "Borș — Ártánd",
    name_i18n: {
      en: "Borș — Ártánd",
      tr: "Borș — Ártánd",
      ro: "Borș — Ártánd",
    },
    country_pair: "HU - RO",
    region: "central",
    coords: { lng: 21.688, lat: 47.105 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map(() => 0),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
    notes: {
      bg: "E60 между Унгария и Румъня. Няма данни за чакане в приложението.",
      en: "E60 between Hungary and Romania. No wait data in the app.",
      tr: "Macaristan ile Romanya arasında E60. Uygulamada bekleme verisi yok.",
      ro: "E60 între Ungaria și România. Fără date de așteptare în aplicație.",
    },
    notes_bg: "E60 между Унгария и Румъня. Няма данни за чакане в приложението.",
  },
  {
    id: "liubotenet",
    name_bg: "Люботен — Калафат",
    name_en: "Liubotenet — Calafat",
    country_pair: "RO - BG",
    region: "balkans",
    coords: { lng: 22.934, lat: 43.991 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 9 && h <= 17 ? 35 : 20
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes: EUROPEAN_BORDER_NOTES.liubotenet,
    notes_bg: EUROPEAN_BORDER_NOTES.liubotenet.bg,
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "krakovets",
    name_bg: "Краковец — Медика",
    name_en: "Krakovets — Medyka",
    country_pair: "UA - PL",
    region: "eastern",
    coords: { lng: 23.015, lat: 49.958 },
    nakordoni_ppid: "id_13",
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 8 && h <= 20 ? 90 : 45
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Украйна — Полша. Дълги опашки.",
    notes: EUROPEAN_BORDER_NOTES["krakovets"],
    document_codes: ["passport","visa_if_needed"],
    vehicle_codes: ["car","truck","bus"],
  },
  {
    id: "terespol",
    name_bg: "Тереспол — Брест",
    name_en: "Terespol — Brest",
    country_pair: "PL - BY",
    region: "eastern",
    coords: { lng: 23.615, lat: 52.075 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 8 && h <= 20 ? 60 : 30
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Полша — Беларус. Виза задължителна.",
    notes: EUROPEAN_BORDER_NOTES["terespol"],
    document_codes: ["passport","visa_if_needed"],
    vehicle_codes: ["car","truck"],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Италия — Словения.",
    notes: EUROPEAN_BORDER_NOTES["gorizia"],
    document_codes: ["id_card"],
    vehicle_codes: ["car"],
  },
  {
    id: "chiasso",
    name_bg: "Киасо — Комо",
    name_en: "Chiasso — Como",
    country_pair: "CH - IT",
    region: "southern",
    coords: { lng: 9.031, lat: 45.833 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 16 && h <= 20 ? 25 : 10
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Швейцария — Италия. Винетка CH.",
    notes: EUROPEAN_BORDER_NOTES["chiasso"],
    document_codes: ["id_card","passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "mont-blanc",
    name_bg: "Тунел Монблан",
    name_en: "Mont Blanc Tunnel",
    country_pair: "FR - IT",
    region: "southern",
    coords: { lng: 6.912, lat: 45.923 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 10 && h <= 18 ? 30 : 15
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Тунел FR-IT. Тол такса, резервация в пик.",
    notes: EUROPEAN_BORDER_NOTES["mont-blanc"],
    document_codes: ["id_card"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "kipi",
    name_bg: "Кипи — Ипсала",
    name_en: "Kipi — Ipsala",
    country_pair: "GR - TR",
    region: "balkans",
    coords: { lng: 26.298, lat: 41.065 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 10 && h <= 18 ? 55 : 30
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Граница Гърция — Турция. Алтернатива на Капитан Андреево.",
    notes: EUROPEAN_BORDER_NOTES["kipi"],
    document_codes: ["passport"],
    vehicle_codes: ["car","truck"],
  },
  {
    id: "roscoff",
    name_bg: "Роскоф — Плимут",
    name_en: "Roscoff — Plymouth",
    country_pair: "FR - GB",
    region: "western",
    coords: { lng: -3.987, lat: 48.727 },
    nakordoni_ppid: null,
    typical_wait_minutes: DEFAULT_HOURLY.map((_, h) =>
      h >= 7 && h <= 19 ? 40 : 20
    ),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: "Паром за Югозападна Англия. Резервирайте билет.",
    notes: EUROPEAN_BORDER_NOTES["roscoff"],
    document_codes: ["passport"],
    vehicle_codes: ["car","bus"],
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

export function getCrossingsByRegion(
  region: EuropeanBorderRegion
): BorderCrossing[] {
  const all = getAllEuropeanCrossings();
  if (region === "all") return all;
  if (region === "bulgaria")
    return all.filter((c) => (c.region ?? "bulgaria") === "bulgaria");
  if (region === "route") return all;
  return all.filter((c) => c.region === region);
}

export function getNonBulgarianCrossings(): BorderCrossing[] {
  return getAllEuropeanCrossings().filter(
    (c) => (c.region ?? "bulgaria") !== "bulgaria"
  );
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
