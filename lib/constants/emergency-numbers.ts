/**
 * BG Road Navigator - Emergency Numbers for European Countries
 * All data in Bulgarian language as required
 */

export interface EmergencyData {
  country: string;
  country_bg: string;
  flag: string;
  police: string;
  ambulance: string;
  fire: string;
  roadside_assistance: string;
  roadside_assistance_name: string;
  eu_emergency: "112";
  towing_service: string;
  notes_bg: string;
}

export const EMERGENCY_DATA: EmergencyData[] = [
  {
    country: "Bulgaria",
    country_bg: "България",
    flag: "🇧🇬",
    police: "166",
    ambulance: "166",
    fire: "167",
    roadside_assistance: "1661",
    roadside_assistance_name: "Авиорент",
    eu_emergency: "112",
    towing_service: "1661",
    notes_bg: "Всички европейски пътници имат право на спешна помощ чрез 112"
  },
  {
    country: "Greece",
    country_bg: "Гръзия",
    flag: "🇬🇷",
    police: "100",
    ambulance: "166",
    fire: "199",
    roadside_assistance: "179",
    roadside_assistance_name: "Ελληνική Ασφάλεια",
    eu_emergency: "112",
    towing_service: "179",
    notes_bg: "В Гъргия виньетката е задължителна за всички автомобили"
  },
  {
    country: "Turkey",
    country_bg: "Турция",
    flag: "🇹🇷",
    police: "155",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "TİHSİS",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Турска виньетка не е необходима за български граждани"
  },
  {
    country: "Serbia",
    country_bg: "Сърбия",
    flag: "🇷🇸",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Putnička zaštita",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Сръбска виньетка е задължителна"
  },
  {
    country: "North Macedonia",
    country_bg: "Северна Македония",
    flag: "🇲🇰",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Macedonian Red Cross",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Виньетка не е необходима за ЕС граждани"
  },
  {
    country: "Romania",
    country_bg: "Румыния",
    flag: "🇷🇴",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Poliția de Stat",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Румънска виньетка е задължителна"
  },
  {
    country: "Hungary",
    country_bg: "Унгария",
    flag: "🇭🇺",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Magyar Anil",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Унгарска виньетка е задължителна за всички"
  },
  {
    country: "Austria",
    country_bg: "Австрия",
    flag: "🇦🇹",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ÖAMTC",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Австрийска виньетка е задължителна"
  },
  {
    country: "Germany",
    country_bg: "Германия",
    flag: "🇩🇪",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ADAC",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Германска виньетка е задължителна"
  },
  {
    country: "Italy",
    country_bg: "Италия",
    flag: "🇮🇹",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Autostrade per l'Italia",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Италианска виньетка е задължителна"
  },
  {
    country: "France",
    country_bg: "Франция",
    flag: "🇫🇷",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ACLE",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Френска виньетка е задължителна"
  },
  {
    country: "Spain",
    country_bg: "Испания",
    flag: "🇪🇸",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "DGT",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Испанска виньетка е задължителна"
  },
  {
    country: "Portugal",
    country_bg: "Португалия",
    flag: "🇵🇹",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ANSR",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Португалска виньетка е задължителна"
  },
  {
    country: "Slovenia",
    country_bg: "Словения",
    flag: "🇸🇮",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "HVOC",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Словенска виньетка е задължителна"
  },
  {
    country: "Croatia",
    country_bg: "Хърватия",
    flag: "🇭🇷",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Hrvatska vatrogasna služba",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Хърватска виньетка е задължителна"
  },
  {
    country: "Bosnia and Herzegovina",
    country_bg: "Босния и Хървогориция",
    flag: "🇧🇦",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Interventna jednota",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Виньетка не е необходима"
  },
  {
    country: "Montenegro",
    country_bg: "Черна гора",
    flag: "🇲🇪",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Crnogorska vatrogasna služba",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Черногорска виньетка е задължителна"
  },
  {
    country: "Albania",
    country_bg: "Албания",
    flag: "🇦🇱",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Policia RRTS",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Албанска виньетка е задължителна"
  },
  {
    country: "Switzerland",
    country_bg: "Швейцария",
    flag: "🇨🇭",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ASLOCA",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Швейцарска виньетка е задължителна"
  },
  {
    country: "Netherlands",
    country_bg: "Нидерландия",
    flag: "🇳🇱",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "ANWB",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Нидерландска виньетка е задължителна"
  },
  {
    country: "Belgium",
    country_bg: "Белгия",
    flag: "🇧🇪",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Touring Club Belgium",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Белгийска виньетка е задължителна"
  },
  {
    country: "Luxembourg",
    country_bg: "Люксембург",
    flag: "🇱🇺",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Touring Club Luxemburg",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Люксембурска виньетка е задължителна"
  },
  {
    country: "Czech Republic",
    country_bg: "Чехия",
    flag: "🇨🇿",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Česká red Cross",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Чешка виньетка е задължителна"
  },
  {
    country: "Slovakia",
    country_bg: "Словакия",
    flag: "🇸🇰",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Slovenský Červený Krst",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Словакска виньетка е задължителна"
  },
  {
    country: "Poland",
    country_bg: "Полша",
    flag: "🇵🇱",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Pogotowie Ratunkowe",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Полска виньетка е задължителна"
  },
  {
    country: "Ukraine",
    country_bg: "Украйна",
    flag: "🇺🇦",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "State Emergency Service",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Екстрена помощ в Украйна работи през 112"
  },
  {
    country: "Moldova",
    country_bg: "Молдова",
    flag: "🇲🇩",
    police: "112",
    ambulance: "112",
    fire: "112",
    roadside_assistance: "112",
    roadside_assistance_name: "Serviciul de Urgență",
    eu_emergency: "112",
    towing_service: "112",
    notes_bg: "Молдовска виньетка е задължителна"
  }
];