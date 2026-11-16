/**
 * Emergency numbers for European countries on the driving corridor.
 * Phone numbers are verified separately — do not change them in locale work.
 */

import type { Locale } from "@/lib/i18n/locale";
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";

export interface EmergencyData {
  country: string;
  country_code: string;
  country_bg: string;
  flag: string;
  police: string;
  ambulance: string;
  fire: string;
  roadside_assistance: string;
  /** Legacy field; use `roadside_name` for display. */
  roadside_assistance_name: string;
  roadside_name: Localized;
  eu_emergency: "112";
  towing_service: string;
  notes: Localized;
  notes_bg: string;
}

function roadsideProper(name: string): Localized {
  return { bg: name, en: name, tr: name, ro: name };
}

type EmergencyInput = {
  country: string;
  country_code: string;
  country_bg: string;
  flag: string;
  police: string;
  ambulance: string;
  fire: string;
  roadside_assistance: string;
  roadside_assistance_name: string;
  roadside_name?: Localized;
  towing_service: string;
  notes: Localized;
};

function defineEmergency(row: EmergencyInput): EmergencyData {
  const roadside_name =
    row.roadside_name ??
    roadsideProper(row.roadside_assistance_name);
  return {
    ...row,
    eu_emergency: "112",
    roadside_name,
    roadside_assistance_name:
      row.roadside_assistance_name || pickText("bg", roadside_name),
    notes_bg: row.notes.bg,
  };
}

const ROWS: EmergencyInput[] = [
  {
    country: "Bulgaria",
    country_code: "BG",
    country_bg: "България",
    flag: "🇧🇬",
    police: "166",
    ambulance: "150",
    fire: "160",
    roadside_assistance: "112",
    roadside_assistance_name: "Пътна помощ / застраховател",
    roadside_name: {
      bg: "Пътна помощ / застраховател",
      en: "Roadside assistance / insurer",
      tr: "Yol yardımı / sigortacı",
      ro: "Asistență rutieră / asigurator",
    },
    towing_service: "112",
    notes: {
      bg: "112 е единният номер. Полиция 166, линейка 150, пожарна 160. Винетка: https://web.bgtoll.bg/",
      en: "112 is the single emergency number. Police 166, ambulance 150, fire 160. Vignette: https://web.bgtoll.bg/",
      tr: "112 tek acil numaradır. Polis 166, ambulans 150, itfaiye 160. Vinyet: https://web.bgtoll.bg/",
      ro: "112 este numărul unic de urgență. Poliție 166, ambulanță 150, pompieri 160. Rovinietă: https://web.bgtoll.bg/",
    },
  },
  {
    country: "Greece",
    country_code: "GR",
    country_bg: "Гърция",
    flag: "🇬🇷",
    police: "100",
    ambulance: "166",
    fire: "199",
    roadside_assistance: "179",
    roadside_assistance_name: "Ελληνική Ασφάλεια",
    towing_service: "179",
    notes: {
      bg: "Няма национална винетка за леки коли — платени магистрали (toll). 112 работи.",
      en: "No national vignette for cars — motorways are tolled. 112 works.",
      tr: "Binek araçlar için ulusal vinyet yok — otoyollar ücretlidir. 112 çalışır.",
      ro: "Fără rovinietă națională pentru autoturisme — autostrăzile cu taxă. 112 funcționează.",
    },
  },
  {
    country: "Turkey",
    country_code: "TR",
    country_bg: "Турция",
    flag: "🇹🇷",
    police: "155",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "TİHSİS",
    towing_service: "112",
    notes: {
      bg: "Електронна тол система (HGS/OGS), не класическа винетка. Паспорт за границата.",
      en: "Electronic toll (HGS/OGS), not a classic vignette. Passport required at the border.",
      tr: "Klasik vinyet değil, elektronik geçiş (HGS/OGS). Sınırda pasaport gerekir.",
      ro: "Taxă electronică (HGS/OGS), nu rovinietă clasică. Pașaport la frontieră.",
    },
  },
  {
    country: "Serbia",
    country_code: "RS",
    country_bg: "Сърбия",
    flag: "🇷🇸",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Putnička zaštita",
    towing_service: "112",
    notes: {
      bg: "Няма винетка. Магистралите се плащат по километър на бариерите.",
      en: "No vignette. Motorways are paid per kilometre at toll barriers.",
      tr: "Vinyet yok. Otoyollar gişelerde kilometre başına ödenir.",
      ro: "Fără rovinietă. Autostrăzile se plătesc pe kilometru la punctele de taxare.",
    },
  },
  {
    country: "North Macedonia",
    country_code: "MK",
    country_bg: "Северна Македония",
    flag: "🇲🇰",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Macedonian Red Cross",
    towing_service: "112",
    notes: {
      bg: "Няма запис за винетка в списъка на приложението. Пътната такса следва регистрацията на колата, не гражданството на водача.",
      en: "No vignette listed in this app. Road charges follow vehicle registration, not the driver's nationality.",
      tr: "Bu uygulamada vinyet kaydı yok. Yol ücreti sürücü uyruğuna değil, aracın tesciline bağlıdır.",
      ro: "Nicio rovinietă în lista aplicației. Taxa rutieră ține de înmatricularea mașinii, nu de cetățenia șoferului.",
    },
  },
  {
    country: "Romania",
    country_code: "RO",
    country_bg: "Румъния",
    flag: "🇷🇴",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Poliția de Stat",
    towing_service: "112",
    notes: {
      bg: "Rovinieta е задължителна. Купете само от официален портал (виж Винетки).",
      en: "Rovinieta is mandatory. Buy only from the official portal (see Vignettes).",
      tr: "Rovinieta zorunludur. Yalnızca resmî portaldan alın (Vinyetler bölümüne bakın).",
      ro: "Rovinieta este obligatorie. Cumpărați doar din portalul oficial (vezi Roviniete).",
    },
  },
  {
    country: "Hungary",
    country_code: "HU",
    country_bg: "Унгария",
    flag: "🇭🇺",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Magyar Anil",
    towing_service: "112",
    notes: {
      bg: "Унгарска винетка е задължителна за всички",
      en: "A Hungarian vignette is mandatory for everyone.",
      tr: "Macar vinyeti herkes için zorunludur.",
      ro: "Rovinieta maghiară este obligatorie pentru toți.",
    },
  },
  {
    country: "Austria",
    country_code: "AT",
    country_bg: "Австрия",
    flag: "🇦🇹",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ÖAMTC",
    towing_service: "112",
    notes: {
      bg: "Австрийска винетка е задължителна",
      en: "An Austrian vignette is mandatory.",
      tr: "Avusturya vinyeti zorunludur.",
      ro: "Vigneta austriacă este obligatorie.",
    },
  },
  {
    country: "Germany",
    country_code: "DE",
    country_bg: "Германия",
    flag: "🇩🇪",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ADAC",
    towing_service: "112",
    notes: {
      bg: "Няма винетка за леки коли. Камионите плащат LKW-Maut.",
      en: "No vignette for cars. Trucks pay LKW-Maut.",
      tr: "Binek araçlarda vinyet yok. Kamyonlar LKW-Maut öder.",
      ro: "Fără rovinietă pentru autoturisme. Camioanele plătesc LKW-Maut.",
    },
  },
  {
    country: "Italy",
    country_code: "IT",
    country_bg: "Италия",
    flag: "🇮🇹",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Autostrade per l'Italia",
    towing_service: "112",
    notes: {
      bg: "Няма винетка — платени автостради (pedaggio).",
      en: "No vignette — motorways are tolled (pedaggio).",
      tr: "Vinyet yok — otoyollar pedaggio ile ücretlidir.",
      ro: "Fără rovinietă — autostrăzile cu pedaggio.",
    },
  },
  {
    country: "France",
    country_code: "FR",
    country_bg: "Франция",
    flag: "🇫🇷",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ACLE",
    towing_service: "112",
    notes: {
      bg: "Няма винетка — péage на магистралите.",
      en: "No vignette — péage on motorways.",
      tr: "Vinyet yok — otoyollarda péage.",
      ro: "Fără rovinietă — péage pe autostrăzi.",
    },
  },
  {
    country: "Spain",
    country_code: "ES",
    country_bg: "Испания",
    flag: "🇪🇸",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "DGT",
    towing_service: "112",
    notes: {
      bg: "Няма национална винетка; някои пътища са платени.",
      en: "No national vignette; some roads are tolled.",
      tr: "Ulusal vinyet yok; bazı yollar ücretlidir.",
      ro: "Fără rovinietă națională; unele drumuri cu taxă.",
    },
  },
  {
    country: "Portugal",
    country_code: "PT",
    country_bg: "Португалия",
    flag: "🇵🇹",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ANSR",
    towing_service: "112",
    notes: {
      bg: "Електронни тол такси / Via Verde — не класическа винетка.",
      en: "Electronic tolls / Via Verde — not a classic vignette.",
      tr: "Elektronik geçiş / Via Verde — klasik vinyet değil.",
      ro: "Taxe electronice / Via Verde — nu e rovinietă clasică.",
    },
  },
  {
    country: "Slovenia",
    country_code: "SI",
    country_bg: "Словения",
    flag: "🇸🇮",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "HVOC",
    towing_service: "112",
    notes: {
      bg: "Словенска винетка е задължителна",
      en: "A Slovenian vignette is mandatory.",
      tr: "Slovenya vinyeti zorunludur.",
      ro: "Rovinieta slovenă este obligatorie.",
    },
  },
  {
    country: "Croatia",
    country_code: "HR",
    country_bg: "Хърватия",
    flag: "🇭🇷",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Hrvatska vatrogasna služba",
    towing_service: "112",
    notes: {
      bg: "Магистрални тол такси (ENC), не винетка.",
      en: "Motorway tolls (ENC), not a vignette.",
      tr: "Otoyol geçiş ücreti (ENC), vinyet değil.",
      ro: "Taxe de autostradă (ENC), nu rovinietă.",
    },
  },
  {
    country: "Bosnia and Herzegovina",
    country_code: "BA",
    country_bg: "Босна и Херцеговина",
    flag: "🇧🇦",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Interventna jednota",
    towing_service: "112",
    notes: {
      bg: "Няма задължителна винетка в списъка на приложението.",
      en: "No mandatory vignette listed in this app.",
      tr: "Bu uygulamada zorunlu vinyet kaydı yok.",
      ro: "Nicio rovinietă obligatorie în lista aplicației.",
    },
  },
  {
    country: "Montenegro",
    country_code: "ME",
    country_bg: "Черна гора",
    flag: "🇲🇪",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Crnogorska vatrogasna služba",
    towing_service: "112",
    notes: {
      bg: "Няма винетка; някои пътища са платени.",
      en: "No vignette; some roads are tolled.",
      tr: "Vinyet yok; bazı yollar ücretlidir.",
      ro: "Fără rovinietă; unele drumuri cu taxă.",
    },
  },
  {
    country: "Albania",
    country_code: "AL",
    country_bg: "Албания",
    flag: "🇦🇱",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Policia RRTS",
    towing_service: "112",
    notes: {
      bg: "Няма винетка; някои пътища са платени.",
      en: "No vignette; some roads are tolled.",
      tr: "Vinyet yok; bazı yollar ücretlidir.",
      ro: "Fără rovinietă; unele drumuri cu taxă.",
    },
  },
  {
    country: "Switzerland",
    country_code: "CH",
    country_bg: "Швейцария",
    flag: "🇨🇭",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ASLOCA",
    towing_service: "112",
    notes: {
      bg: "Швейцарска винетка е задължителна",
      en: "A Swiss vignette is mandatory.",
      tr: "İsviçre vinyeti zorunludur.",
      ro: "Vigneta elvețiană este obligatorie.",
    },
  },
  {
    country: "Netherlands",
    country_code: "NL",
    country_bg: "Нидерландия",
    flag: "🇳🇱",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ANWB",
    towing_service: "112",
    notes: {
      bg: "Няма винетка за леки коли.",
      en: "No vignette for cars.",
      tr: "Binek araçlarda vinyet yok.",
      ro: "Fără rovinietă pentru autoturisme.",
    },
  },
  {
    country: "Belgium",
    country_code: "BE",
    country_bg: "Белгия",
    flag: "🇧🇪",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Touring Club Belgium",
    towing_service: "112",
    notes: {
      bg: "Няма винетка за леки коли.",
      en: "No vignette for cars.",
      tr: "Binek araçlarda vinyet yok.",
      ro: "Fără rovinietă pentru autoturisme.",
    },
  },
  {
    country: "Luxembourg",
    country_code: "LU",
    country_bg: "Люксембург",
    flag: "🇱🇺",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Touring Club Luxemburg",
    towing_service: "112",
    notes: {
      bg: "Няма винетка за леки коли.",
      en: "No vignette for cars.",
      tr: "Binek araçlarda vinyet yok.",
      ro: "Fără rovinietă pentru autoturisme.",
    },
  },
  {
    country: "Czech Republic",
    country_code: "CZ",
    country_bg: "Чехия",
    flag: "🇨🇿",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Česká red Cross",
    towing_service: "112",
    notes: {
      bg: "Чешка винетка е задължителна",
      en: "A Czech vignette is mandatory.",
      tr: "Çek vinyeti zorunludur.",
      ro: "Rovinieta cehă este obligatorie.",
    },
  },
  {
    country: "Slovakia",
    country_code: "SK",
    country_bg: "Словакия",
    flag: "🇸🇰",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Slovenský Červený Krst",
    towing_service: "112",
    notes: {
      bg: "Словакска винетка е задължителна",
      en: "A Slovak vignette is mandatory.",
      tr: "Slovakya vinyeti zorunludur.",
      ro: "Rovinieta slovacă este obligatorie.",
    },
  },
  {
    country: "Poland",
    country_code: "PL",
    country_bg: "Полша",
    flag: "🇵🇱",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Pogotowie Ratunkowe",
    towing_service: "112",
    notes: {
      bg: "e-TOLL на избрани пътища; няма класическа винетка за всички магистрали.",
      en: "e-TOLL on selected roads; no classic vignette for all motorways.",
      tr: "Seçili yollarda e-TOLL; tüm otoyollar için klasik vinyet yok.",
      ro: "e-TOLL pe anumite drumuri; fără rovinietă clasică pentru toate autostrăzile.",
    },
  },
  {
    country: "Ukraine",
    country_code: "UA",
    country_bg: "Украйна",
    flag: "🇺🇦",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "State Emergency Service",
    towing_service: "112",
    notes: {
      bg: "Екстрена помощ в Украйна работи през 112",
      en: "Emergency services in Ukraine use 112.",
      tr: "Ukrayna'da acil yardım 112 üzerinden.",
      ro: "Serviciile de urgență din Ucraina folosesc 112.",
    },
  },
  {
    country: "Moldova",
    country_code: "MD",
    country_bg: "Молдова",
    flag: "🇲🇩",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Serviciul de Urgență",
    towing_service: "112",
    notes: {
      bg: "Молдовска винетка е задължителна",
      en: "A Moldovan vignette is mandatory.",
      tr: "Moldova vinyeti zorunludur.",
      ro: "Rovinieta moldovenească este obligatorie.",
    },
  },
];

export const EMERGENCY_DATA: EmergencyData[] = ROWS.map(defineEmergency);

export function emergencyNotesText(
  locale: Locale,
  row: Pick<EmergencyData, "notes" | "notes_bg">
): string {
  if (row.notes) return pickText(locale, row.notes);
  return row.notes_bg;
}

export function emergencyRoadsideName(
  locale: Locale,
  row: Pick<EmergencyData, "roadside_name" | "roadside_assistance_name">
): string {
  return pickText(locale, row.roadside_name);
}