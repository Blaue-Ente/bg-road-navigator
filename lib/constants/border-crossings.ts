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
  /** A small post: shown and offered as an alternative, but the planner prefers main crossings. */
  minor?: boolean;
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
    tr: "Romanya'ya giden Tuna Köprüsü. Orta Avrupa için önemli bir bağlantı.",
    ro: "Pod peste Dunăre spre România. Legătură importantă cu Europa Centrală.",
  },
  "danube-bridge-ruse": {
    bg: "Вторият мост над Дунав. Свързва Русе с Джурджу.",
    en: "The second Danube bridge. Connects Ruse with Giurgiu.",
    tr: "İkinci Tuna Köprüsü. Ruse ile Giurgiu'yu birbirine bağlar.",
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
  bregovo: {
    bg: "Граничен пункт към Сърбия при Брегово (срещу Мокрание), далеч от Калотина. Удобен за северозападна България.",
    en: "Crossing into Serbia at Bregovo (opposite Mokranje), far from Kalotina. Handy for north-western Bulgaria.",
    tr: "Bregovo'da (Mokranje karşısında) Sırbistan'a açılan sınır kapısı; Kalotina'dan uzak. Kuzeybatı Bulgaristan için uygun.",
    ro: "Punct spre Serbia la Bregovo (vizavi de Mokranje), departe de Kalotina. Potrivit pentru nord-vestul Bulgariei.",
  },
  "vrashka-chuka": {
    bg: "Граничен пункт към Сърбия при Връшка чука (срещу Рготина). По-малък от Калотина, пътят е планински.",
    en: "Crossing into Serbia at Vrashka Chuka (opposite Rgotina). Smaller than Kalotina, with a mountain road.",
    tr: "Vrashka Chuka'da (Rgotina karşısında) Sırbistan'a açılan sınır kapısı. Kalotina'dan küçük, yol dağlık.",
    ro: "Punct spre Serbia la Vrashka Chuka (vizavi de Rgotina). Mai mic decât Kalotina, drum montan.",
  },
  strezimirovtsi: {
    bg: "Малък граничен пункт към Сърбия при Стрезимировци (Жеравино), югозападно от Калотина.",
    en: "Small crossing into Serbia at Strezimirovtsi (Zheravino), south-west of Kalotina.",
    tr: "Strezimirovtsi'de (Zheravino) Sırbistan'a açılan küçük kapı; Kalotina'nın güneybatısında.",
    ro: "Punct mic spre Serbia la Strezimirovtsi (Zheravino), la sud-vest de Kalotina.",
  },
  oltomantsi: {
    bg: "Малък граничен пункт към Сърбия при Олтоманци (Рибарци), по пътя към Босилеград и Враня.",
    en: "Small crossing into Serbia at Oltomantsi (Ribarci), on the road to Bosilegrad and Vranje.",
    tr: "Oltomantsi'de (Ribarci) Sırbistan'a açılan küçük kapı; Bosilegrad ve Vranje yolu üzerinde.",
    ro: "Punct mic spre Serbia la Oltomantsi (Ribarci), pe drumul spre Bosilegrad și Vranje.",
  },
  logodazh: {
    bg: "Граничен пункт към Северна Македония при Логодаж (бивш Станке Лисичково), по пътя от Благоевград.",
    en: "Crossing into North Macedonia at Logodazh (formerly Stanke Lisichkovo), on the road from Blagoevgrad.",
    tr: "Logodazh'ta (eski Stanke Lisichkovo) Kuzey Makedonya'ya açılan sınır kapısı; Blagoevgrad yolu üzerinde.",
    ro: "Punct spre Macedonia de Nord la Logodazh (fost Stanke Lisichkovo), pe drumul din Blagoevgrad.",
  },
  ilinden: {
    bg: "Граничен пункт към Гърция при Гоце Делчев (срещу Ексохи). Алтернатива на Кулата.",
    en: "Crossing into Greece at Gotse Delchev (opposite Exochi). An alternative to Kulata.",
    tr: "Gotse Delchev'de (Exochi karşısında) Yunanistan'a açılan sınır kapısı. Kulata'ya alternatif.",
    ro: "Punct spre Grecia la Gotse Delchev (vizavi de Exochi). Alternativă la Kulata.",
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: BORDER_NOTES.zlatarevo.bg,
    notes: BORDER_NOTES.zlatarevo,
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "bregovo",
    minor: true,
    name_bg: "Брегово",
    name_en: "Bregovo",
    country_pair: "BG - RS",
    region: "bulgaria",
    coords: { lng: 22.6269, lat: 44.1541 },
    // Approximate rough profile, not measured; no live feed is wired for this post.
    nakordoni_ppid: "id_392",
    typical_wait_minutes: Array.from({ length: 24 }, (_, hour) => hour >= 8 && hour <= 20 ? 15 : 8),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: BORDER_NOTES["bregovo"].bg,
    notes: BORDER_NOTES["bregovo"],
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "vrashka-chuka",
    minor: true,
    name_bg: "Връшка чука",
    name_en: "Vrashka Chuka",
    country_pair: "BG - RS",
    region: "bulgaria",
    coords: { lng: 22.3801, lat: 43.849 },
    // Approximate rough profile, not measured; no live feed is wired for this post.
    nakordoni_ppid: "id_394",
    typical_wait_minutes: Array.from({ length: 24 }, (_, hour) => hour >= 8 && hour <= 20 ? 15 : 8),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: BORDER_NOTES["vrashka-chuka"].bg,
    notes: BORDER_NOTES["vrashka-chuka"],
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "strezimirovtsi",
    minor: true,
    name_bg: "Стрезимировци",
    name_en: "Strezimirovtsi",
    country_pair: "BG - RS",
    region: "bulgaria",
    coords: { lng: 22.4493, lat: 42.798 },
    // Approximate rough profile, not measured; no live feed is wired for this post.
    nakordoni_ppid: "id_396",
    typical_wait_minutes: Array.from({ length: 24 }, (_, hour) => hour >= 8 && hour <= 20 ? 10 : 5),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: BORDER_NOTES["strezimirovtsi"].bg,
    notes: BORDER_NOTES["strezimirovtsi"],
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "oltomantsi",
    minor: true,
    name_bg: "Олтоманци",
    name_en: "Oltomantsi",
    country_pair: "BG - RS",
    region: "bulgaria",
    coords: { lng: 22.5269, lat: 42.4164 },
    // Approximate rough profile, not measured; no live feed is wired for this post.
    nakordoni_ppid: "id_398",
    typical_wait_minutes: Array.from({ length: 24 }, (_, hour) => hour >= 8 && hour <= 20 ? 10 : 5),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: BORDER_NOTES["oltomantsi"].bg,
    notes: BORDER_NOTES["oltomantsi"],
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "logodazh",
    minor: true,
    name_bg: "Логодаж",
    name_en: "Logodazh",
    country_pair: "BG - MK",
    region: "bulgaria",
    coords: { lng: 22.8759, lat: 41.9867 },
    // Approximate rough profile, not measured; no live feed is wired for this post.
    nakordoni_ppid: null,
    typical_wait_minutes: Array.from({ length: 24 }, (_, hour) => hour >= 8 && hour <= 20 ? 15 : 8),
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
    notes_bg: BORDER_NOTES["logodazh"].bg,
    notes: BORDER_NOTES["logodazh"],
    document_codes: ["id_card", "passport"],
    vehicle_codes: ["car", "truck", "bus", "motorcycle"],
  },
  {
    id: "ilinden",
    name_bg: "Илинден",
    name_en: "Ilinden",
    country_pair: "BG - GR",
    region: "bulgaria",
    coords: { lng: 23.3386, lat: 41.5167 },
    nakordoni_ppid: null,
    typical_wait_minutes: [
      22, 22, 22, 22, 22, 22, 25, 30, 35, 40, 45, 40, 35, 30, 25, 25, 25, 30,
      35, 40, 35, 30, 25, 22,
    ],
    working_hours: "00:00 - 24:00",
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    accepted_documents: [],
    vehicle_types_allowed: [],
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
    en: "Danube Bridge Vidin–Calafat",
    tr: "Tuna Köprüsü Vidin–Calafat",
    ro: "Podul Dunărea Vidin–Calafat",
  },
  "danube-bridge-ruse": {
    en: "Danube Bridge Ruse–Giurgiu",
    tr: "Tuna Köprüsü Ruse–Giurgiu",
    ro: "Podul Dunărea Ruse–Giurgiu",
  },
  gyueshevo: { tr: "Güleburun", ro: "Gjorče Petrov" },
  zlatarevo: { tr: "İbrice", ro: "Zlatarevo" },
  bregovo: { tr: "Bregovo", ro: "Bregovo" },
  "vrashka-chuka": { tr: "Vrška Čuka", ro: "Vrashka Chuka" },
  strezimirovtsi: { tr: "Strezimirovtsi", ro: "Strezimirovtsi" },
  oltomantsi: { tr: "Oltomantsi", ro: "Oltomantsi" },
  logodazh: { tr: "Logodazh", ro: "Logodazh" },
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

export type DanubeBridgeId = "danube-bridge-vidin" | "danube-bridge-ruse";

function danubeBridgeRow(id: DanubeBridgeId): BorderCrossing {
  const row = BORDER_CROSSINGS.find((c) => c.id === id);
  if (!row) throw new Error(`Missing border crossing: ${id}`);
  return row;
}

/** Canonical Vidin–Calafat / Ruse–Giurgiu labels (same as `borderDisplayName`). */
export function danubeBridgeDisplayName(id: DanubeBridgeId, locale: Locale): string {
  return borderDisplayName(locale, danubeBridgeRow(id));
}

/** Single-sentence note naming the bridge only (e.g. Liubotenet EU row). */
export function danubeBridgeShortNote(id: DanubeBridgeId, locale: Locale): string {
  return `${danubeBridgeDisplayName(id, locale)}.`;
}

/** Bucharest → Sofia corridor copy for non-Bulgarian locales. */
export function bucharestSofiaCorridorDescription(locale: Exclude<Locale, "bg">): string {
  const vidin = danubeBridgeDisplayName("danube-bridge-vidin", locale);
  const ruse = danubeBridgeDisplayName("danube-bridge-ruse", locale);
  if (locale === "en") return `Via ${vidin} or ${ruse}`;
  if (locale === "tr") return `${vidin} veya ${ruse} üzerinden`;
  return `Prin ${vidin} sau ${ruse}`;
}