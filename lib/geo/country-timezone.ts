/** IANA zone for overnight wake (08:00 local). Fallback is Sofia. */
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

const ZONE_LABEL_BG: Record<string, string> = {
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

export function timeZoneLabelBg(timeZone: string): string {
  return ZONE_LABEL_BG[timeZone] ?? "местно време";
}