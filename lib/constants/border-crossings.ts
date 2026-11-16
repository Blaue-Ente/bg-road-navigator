/**
 * BG Road Navigator - Border Crossing Definitions
 * Bulgarian border crossings + metadata for pan-European routing
 */

import type { Locale } from "@/lib/i18n/locale";
import type { Localized, LocalizedMap } from "@/lib/i18n/localized-field";
import { pickI18nText, pickText } from "@/lib/i18n/localized-field";

export type BorderDocument = "id_card" | "passport" | "visa_some" | "visa_if_needed";
export type BorderVehicle = "car" | "truck" | "bus" | "motorcycle";

export interface BorderCrossing {
  id: string;
  name_bg: string;
  name_en: string;
  name_i18n?: LocalizedMap;
  country_pair: string;
  region?: string;
  coords: { lng: number; lat: number };
  webcam_urls?: string[];
  nakordoni_ppid?: string | null;
  typical_wait_minutes: number[];
  working_hours: string;
  accepted_documents: string[];
  vehicle_types_allowed: string[];
  notes_bg: string;
  notes?: Localized;
  document_codes?: BorderDocument[];
  vehicle_codes?: BorderVehicle[];
}

const BORDER_NOTES: Record<string, Localized> = {
  kalotina: {
    bg: "Най-голямата граница между България и Сърбия. Често има големи опашки през уикендите.",
    en: "The largest crossing between Bulgaria and Serbia. Long queues are common at weekends.",
    tr: "Bulgaristan ile Sırbistan arasındaki en büyük sınır kapısı. Hafta sonları uzun kuyruklar sık görülür.",
    ro: "Cel mai mare punct de trecere între Bulgaria și Serbia. Cozile lungi sunt frecvente în weekend.",
  },
  kulata: {
    bg: "Основната граница към Гърция. Висок трафик през лятото.",
    en: "The main crossing into Greece. Heavy traffic in summer.",
    tr: "Yunanistan'a açılan ana sınır kapısı. Yazın trafik yoğundur.",
    ro: "Principalul punct către Grecia. Trafic intens vara.",
  },
  "kapitan-andreevo": {
    bg: "Най-натоварената граница с Турция. Дълги опашки през сезона.",
    en: "The busiest crossing with Turkey. Long queues during the travel season.",
    tr: "Türkiye ile en yoğun sınır kapısı. Sezonda uzun kuyruklar olur.",
    ro: "Cel mai aglomerat punct cu Turcia. Cozi lungi în sezon.",
  },
  "danube-bridge-vidin": {
    bg: "Мост над Дунав към Румъния. Важна връзка с Централна Европа.",
    en: "Danube bridge into Romania. A key link to Central Europe.",
    tr: "Romanya'ya giden Tuna köprüsü. Orta Avrupa için önemli bir bağlantı.",
    ro: "Pod peste Dunăre spre România. Legătură importantă cu Europa Centrală.",
  },
  "danube-bridge-ruse": {
    bg: "Вторият мост над Дунав. Свързва Русе с Джурджу.",
    en: "The second Danube bridge. Connects Ruse with Giurgiu.",
    tr: "İkinci Tuna köprüsü. Ruse ile Giurgiu'yu birbirine bağlar.",
    ro: "Al doilea pod peste Dunăre. Leagă Ruse de Giurgiu.",
  },
  gyueshevo: {
    bg: "Граничен пункт към Северна Македония. Планински път.",
    en: "Crossing into North Macedonia. Mountain road.",
    tr: "Kuzey Makedonya'ya açılan sınır kapısı. Dağ yolu.",
    ro: "Punct spre Macedonia de Nord. Drum montan.",
  },
  zlatarevo: {
    bg: "По-малка граница към Северна Македония. По-малко натоварване.",
    en: "Smaller crossing into North Macedonia. Usually lighter traffic.",
    tr: "Kuzey Makedonya'ya açılan daha küçük bir kapı. Genelde daha az yoğunluk.",
    ro: "Punct mai mic spre Macedonia de Nord. De obicei mai puțin trafic.",
  },
  ilinden: {
    bg: "Най-новата граница с Македония. Добра алтернатива на Кулата.",
    en: "The newest crossing with North Macedonia. A good alternative to Kulata.",
    tr: "Makedonya ile en yeni sınır kapısı. Kulata'ya iyi bir alternatif.",
    ro: "Cel mai nou punct cu Macedonia de Nord. Alternativă bună la Kulata.",
  },
  promachon: {
    bg: "Алтернатива на Кулата за Гърция. По-малко натоварване.",
    en: "Alternative to Kulata for Greece. Usually less busy.",
    tr: "Yunanistan için Kulata'ya alternatif. Genelde daha az yoğun.",
    ro: "Alternativă la Kulata spre Grecia. De obicei mai puțin aglomerat.",
  },
  makaza: {
    bg: "Нова граница в Източните Родопи. Добра за Южна България.",
    en: "New crossing in the Eastern Rhodopes. Handy for southern Bulgaria.",
    tr: "Doğu Rodoplar'da yeni bir kapı. Güney Bulgaristan için uygun.",
    ro: "Punct nou în Rhodopele de Est. Potrivit pentru sudul Bulgariei.",
  },
  "malko-tarnovo": {
    bg: "Граничен пункт в Странджа. По-малко натоварване от Капитан Андреево.",
    en: "Crossing in the Strandzha region. Usually quieter than Kapitan Andreevo.",
    tr: "Istranca bölgesinde sınır kapısı. Kapıkule'ye göre genelde daha sakin.",
    ro: "Punct în regiunea Strandzha. De obicei mai liniștit decât Kapitan Andreevo.",
  },
  lesovo: {
    bg: "Нова граница с Турция. Добра алтернатива на Капитан Андреево.",
    en: "New crossing with Turkey. A good alternative to Kapitan Andreevo.",
    tr: "Türkiye ile yeni bir sınır kapısı. Kapıkule'ye iyi bir alternatif.",
    ro: "Punct nou cu Turcia. Alternativă bună la Kapitan Andreevo.",
  },
};

export const BORDER_CROSSINGS: BorderCrossing[] = [
  {
    id: "kalotina",
    name_bg: "Калотина",
    name_en: "Kalotina",
    country_pair: "BG - RS",
    region: "bulgaria",
    coords: { lng: 22.8969, lat: 42.9833 },
    nakordoni_ppid: "id_390",
    typical_wait_minutes: [
      15, 15, 15, 15, 15, 15, 20, 25, 30, 35, 40, 35, 30, 25, 20, 20, 20, 25,
      30, 35, 30, 25, 20, 18,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.kalotina.bg,
    notes: BORDER_NOTES.kalotina,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "kulata",
    name_bg: "Кулата",
    name_en: "Kulata",
    country_pair: "BG - GR",
    region: "bulgaria",
    coords: { lng: 23.358, lat: 41.39 },
    nakordoni_ppid: "id_484",
    typical_wait_minutes: [
      20, 20, 20, 20, 20, 20, 25, 30, 35, 40, 45, 40, 35, 30, 25, 25, 25, 30,
      35, 40, 35, 30, 25, 22,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.kulata.bg,
    notes: BORDER_NOTES.kulata,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "kapitan-andreevo",
    name_bg: "Капитан Андреево",
    name_en: "Kapitan Andreevo",
    country_pair: "BG - TR",
    region: "bulgaria",
    coords: { lng: 26.3056, lat: 41.8833 },
    nakordoni_ppid: "id_384",
    typical_wait_minutes: [
      30, 30, 30, 30, 30, 35, 40, 50, 60, 75, 90, 75, 60, 45, 40, 35, 35, 40,
      50, 60, 50, 40, 35, 32,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза (за някои националности)"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES["kapitan-andreevo"].bg,
    notes: BORDER_NOTES["kapitan-andreevo"],
    document_codes: ["passport", "visa_some"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "danube-bridge-vidin",
    name_bg: "Дунав мост Видин",
    name_en: "Danube Bridge Vidin",
    country_pair: "BG - RO",
    region: "bulgaria",
    coords: { lng: 22.8806, lat: 43.9928 },
    nakordoni_ppid: "id_289",
    typical_wait_minutes: [
      25, 25, 25, 25, 25, 25, 30, 35, 40, 45, 50, 45, 40, 35, 30, 30, 30, 35,
      40, 45, 40, 35, 30, 27,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES["danube-bridge-vidin"].bg,
    notes: BORDER_NOTES["danube-bridge-vidin"],
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "danube-bridge-ruse",
    name_bg: "Дунав мост Русе",
    name_en: "Danube Bridge Ruse",
    country_pair: "BG - RO",
    region: "bulgaria",
    coords: { lng: 25.9714, lat: 43.8992 },
    nakordoni_ppid: "id_292",
    typical_wait_minutes: [
      28, 28, 28, 28, 28, 28, 32, 38, 45, 50, 55, 50, 45, 40, 35, 35, 35, 40,
      45, 50, 45, 40, 35, 30,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES["danube-bridge-ruse"].bg,
    notes: BORDER_NOTES["danube-bridge-ruse"],
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "gyueshevo",
    name_bg: "Гюешево",
    name_en: "Gyueshevo",
    country_pair: "BG - MK",
    region: "bulgaria",
    coords: { lng: 22.5167, lat: 42.2167 },
    nakordoni_ppid: "id_400",
    typical_wait_minutes: [
      20, 20, 20, 20, 20, 20, 22, 25, 30, 35, 40, 35, 30, 25, 22, 22, 22, 25,
      30, 35, 30, 25, 22, 20,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.gyueshevo.bg,
    notes: BORDER_NOTES.gyueshevo,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "zlatarevo",
    name_bg: "Златарево",
    name_en: "Zlatarevo",
    country_pair: "BG - MK",
    region: "bulgaria",
    coords: { lng: 23.0667, lat: 41.4667 },
    nakordoni_ppid: "id_403",
    typical_wait_minutes: [
      18, 18, 18, 18, 18, 18, 20, 24, 28, 32, 36, 32, 28, 24, 20, 20, 20, 24,
      28, 32, 28, 24, 20, 18,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.zlatarevo.bg,
    notes: BORDER_NOTES.zlatarevo,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "ilinden",
    name_bg: "Илинден",
    name_en: "Ilinden",
    country_pair: "BG - MK",
    region: "bulgaria",
    coords: { lng: 23.3386, lat: 41.5167 },
    nakordoni_ppid: null,
    typical_wait_minutes: [
      22, 22, 22, 22, 22, 22, 25, 30, 35, 40, 45, 40, 35, 30, 25, 25, 25, 30,
      35, 40, 35, 30, 25, 22,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.ilinden.bg,
    notes: BORDER_NOTES.ilinden,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "promachon",
    name_bg: "Промахон",
    name_en: "Promachon",
    country_pair: "BG - GR",
    region: "bulgaria",
    coords: { lng: 23.3639, lat: 41.5167 },
    nakordoni_ppid: "id_485",
    typical_wait_minutes: [
      25, 25, 25, 25, 25, 25, 28, 35, 40, 45, 50, 45, 40, 35, 28, 28, 28, 35,
      40, 45, 40, 35, 28, 25,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.promachon.bg,
    notes: BORDER_NOTES.promachon,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "makaza",
    name_bg: "Маказа",
    name_en: "Makaza",
    country_pair: "BG - GR",
    region: "bulgaria",
    coords: { lng: 25.3833, lat: 41.0833 },
    nakordoni_ppid: null,
    typical_wait_minutes: [
      20, 20, 20, 20, 20, 20, 22, 28, 32, 38, 42, 38, 32, 28, 22, 22, 22, 28,
      32, 38, 32, 28, 22, 20,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Лична карта", "Паспорт"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.makaza.bg,
    notes: BORDER_NOTES.makaza,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "malko-tarnovo",
    name_bg: "Малко Търново",
    name_en: "Malko Tarnovo",
    country_pair: "BG - TR",
    region: "bulgaria",
    coords: { lng: 27.5167, lat: 42.0333 },
    nakordoni_ppid: "id_388",
    typical_wait_minutes: [
      30, 30, 30, 30, 30, 35, 40, 50, 60, 70, 80, 70, 60, 50, 45, 40, 40, 50,
      60, 70, 60, 50, 45, 35,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза (за някои националности)"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES["malko-tarnovo"].bg,
    notes: BORDER_NOTES["malko-tarnovo"],
    document_codes: ["passport", "visa_some"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "lesovo",
    name_bg: "Лесово",
    name_en: "Lesovo",
    country_pair: "BG - TR",
    region: "bulgaria",
    coords: { lng: 26.9333, lat: 42.1167 },
    nakordoni_ppid: "id_386",
    typical_wait_minutes: [
      28, 28, 28, 28, 28, 32, 38, 48, 58, 68, 78, 68, 58, 48, 42, 38, 38, 48,
      58, 68, 58, 48, 42, 33,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: ["Паспорт", "Виза (за някои националности)"],
    vehicle_types_allowed: ["Автомобил", "Камион", "Автобус", "Мотоциклет"],
    notes_bg: BORDER_NOTES.lesovo.bg,
    notes: BORDER_NOTES.lesovo,
    document_codes: ["passport", "visa_some"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
];

const BORDER_NAME_I18N: Record<string, LocalizedMap> = {
  kalotina: { tr: "Kalotina", ro: "Kalotina" },
  kulata: { tr: "Kulata", ro: "Kulata" },
  "kapitan-andreevo": {
    tr: "Kapıkule",
    ro: "Capitan Andreevo",
  },
  "danube-bridge-vidin": {
    tr: "Tuna Köprüsü Vidin–Calafat",
    ro: "Podul Dunărea Vidin–Calafat",
  },
  "danube-bridge-ruse": {
    tr: "Tuna Köprüsü Ruse–Giurgiu",
    ro: "Podul Dunărea Ruse–Giurgiu",
  },
  gyueshevo: { tr: "Güleburun", ro: "Gjorče Petrov" },
  zlatarevo: { tr: "İbrice", ro: "Zlatarevo" },
  ilinden: { tr: "İlinden", ro: "Ilinden" },
  promachon: { tr: "Promah", ro: "Promachon" },
  makaza: { tr: "Makaza", ro: "Makaza" },
  "malko-tarnovo": { tr: "Dereköy", ro: "Malko Târnovo" },
  lesovo: { tr: "Hamzabeyli", ro: "Lesovo" },
  nadlac: { en: "Nadlac II — Nădlac", tr: "Nadlac II — Nădlac", ro: "Nădlac II — Nădlac" },
  bors: { en: "Borș — Ártánd", tr: "Borș — Ártánd", ro: "Borș — Ártánd" },
  horgos: { en: "Horgoš — Röszke", tr: "Horgoš — Röszke", ro: "Horgoš — Röszke" },
  "horgos-road": {
    en: "Horgoš motorway — Röszke",
    tr: "Horgoš otoyolu — Röszke",
    ro: "Autostrada Horgoš — Röszke",
  },
  tompa: { en: "Tompa — Kelebia", tr: "Tompa — Kelebia", ro: "Tompa — Kelebia" },
  hercegszanto: {
    en: "Hercegszántó — Backi Breg",
    tr: "Hercegszántó — Backi Breg",
    ro: "Hercegszántó — Backi Breg",
  },
};

export function borderDisplayName(
  locale: Locale,
  border: {
    id?: string;
    crossing_id?: string;
    name_bg: string;
    name_en?: string;
    name_i18n?: LocalizedMap;
  }
): string {
  const id = border.id ?? border.crossing_id ?? "";
  const merged: LocalizedMap = {
    en: border.name_en,
    ...BORDER_NAME_I18N[id],
    ...border.name_i18n,
  };
  if (locale === "bg") return border.name_bg;
  return pickI18nText(locale, {
    bg: border.name_bg,
    en: border.name_en,
    i18n: merged,
  });
}

export function borderCrossingName(
  crossing: Pick<BorderCrossing, "id" | "name_bg" | "name_en" | "name_i18n">,
  locale: Locale
): string {
  return borderDisplayName(locale, crossing);
}

export function borderCrossingI18n(id: string): LocalizedMap | undefined {
  return BORDER_NAME_I18N[id];
}

export function borderNotesText(
  locale: Locale,
  crossing: Pick<BorderCrossing, "notes" | "notes_bg">
): string {
  if (crossing.notes) return pickText(locale, crossing.notes);
  return crossing.notes_bg;
}