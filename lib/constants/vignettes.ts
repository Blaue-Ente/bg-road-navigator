/**
 * Official vignette and distance-toll links only.
 * Do not scrape, and do not link resellers or intermediaries.
 */

export type RoadChargeKind = "vignette" | "distance_toll";

export interface VignetteLink {
  country_code: string;
  kind: RoadChargeKind;
  name_bg: string;
  name_en: string;
  official_url: string;
  link_role: "shop" | "info";
  notes_bg?: string;
}

export const OFFICIAL_VIGNETTE_LINKS: VignetteLink[] = [
  {
    country_code: "BG",
    kind: "vignette",
    name_bg: "България — електронна винетка",
    name_en: "Bulgaria e-vignette",
    official_url: "https://web.bgtoll.bg/",
    link_role: "shop",
    notes_bg:
      "Купувайте на web.bgtoll.bg. Обща информация: https://www.bgtoll.bg/",
  },
  {
    country_code: "AT",
    kind: "vignette",
    name_bg: "Австрия — ASFINAG винетка",
    name_en: "Austria ASFINAG vignette",
    official_url: "https://shop.asfinag.at/",
    link_role: "shop",
    notes_bg: "Дигитална или стикер винетка + GO-Box за тежък трафик.",
  },
  {
    country_code: "HU",
    kind: "vignette",
    name_bg: "Унгария — e-matrica / HU-GO",
    name_en: "Hungary e-vignette / HU-GO",
    official_url: "https://ematrica.nemzetiutdij.hu/en/vignette-purchase/",
    link_role: "shop",
    notes_bg: "Леки автомобили: e-matrica. Камиони: HU-GO.",
  },
  {
    country_code: "CH",
    kind: "vignette",
    name_bg: "Швейцария — е-винетка",
    name_en: "Switzerland e-vignette",
    official_url: "https://via.admin.ch/shop",
    link_role: "shop",
    notes_bg:
      "Годишна е-винетка от официалния магазин Via. Ако страницата не се отвори, отворете я в обикновен браузър.",
  },
  {
    country_code: "SI",
    kind: "vignette",
    name_bg: "Словения — e-vinjeta",
    name_en: "Slovenia e-vignette",
    official_url: "https://evinjeta.dars.si/en",
    link_role: "shop",
    notes_bg: "Официален магазин на DARS.",
  },
  {
    country_code: "CZ",
    kind: "vignette",
    name_bg: "Чехия — електронна винетка",
    name_en: "Czech e-vignette",
    official_url: "https://edalnice.gov.cz/",
    link_role: "shop",
    notes_bg: "Официален магазин. edalnice.cz пренасочва тук.",
  },
  {
    country_code: "SK",
    kind: "vignette",
    name_bg: "Словакия — eznamka",
    name_en: "Slovakia eznamka",
    official_url: "https://www.eznamka.sk/",
    link_role: "shop",
    notes_bg: "Електронна винетка за магистрали.",
  },
  {
    country_code: "RO",
    kind: "vignette",
    name_bg: "Румъния — rovinieta",
    name_en: "Romania rovinieta",
    official_url: "https://portal.etoll.ro/vinieta-ro",
    link_role: "shop",
    notes_bg:
      "Rovinieta се купува през eToll / TollRo. Не купувайте от препродавачи.",
  },
  {
    country_code: "RS",
    kind: "distance_toll",
    name_bg: "Сърбия — тол на километър",
    name_en: "Serbia distance toll",
    official_url:
      "https://www.putevi-srbije.rs/index.php/en/etc-elektronic-toll-collection",
    link_role: "info",
    notes_bg:
      "Няма винетка. Магистралите се плащат по изминато разстояние на бариерите на Пътища Сърбия — в брой, с карта или с ENP таг.",
  },
  {
    country_code: "HR",
    kind: "distance_toll",
    name_bg: "Хърватия — тол на километър",
    name_en: "Croatia distance toll",
    official_url: "https://www.hac.hr/en/toll/etc",
    link_role: "info",
    notes_bg:
      "Няма винетка за леки коли. Hrvatske autoceste събира тол по отсечки — на бариера или с ENC устройство.",
  },
  {
    country_code: "TR",
    kind: "distance_toll",
    name_bg: "Турция — HGS тол",
    name_en: "Turkey HGS toll",
    official_url: "https://hgsmusteri.ptt.gov.tr/",
    link_role: "shop",
    notes_bg:
      "Няма винетка. Мостове и магистрали се плащат с HGS (PTT) по тарифа на KGM. Чужди номера се регистрират преди пътуване.",
  },
];

const CODE_ALIASES: Record<string, string> = {
  BULGARIA: "BG",
  AUSTRIA: "AT",
  HUNGARY: "HU",
  SWITZERLAND: "CH",
  SLOVENIA: "SI",
  CZECHIA: "CZ",
  "CZECH REPUBLIC": "CZ",
  SLOVAKIA: "SK",
  ROMANIA: "RO",
  SERBIA: "RS",
  CROATIA: "HR",
  TURKEY: "TR",
  TURKIYE: "TR",
  TÜRKIYE: "TR",
};

export function getVignetteByCountryCode(
  code: string
): VignetteLink | undefined {
  const normalized = code.trim().toUpperCase();
  const mapped = CODE_ALIASES[normalized] ?? normalized;
  return OFFICIAL_VIGNETTE_LINKS.find((v) => v.country_code === mapped);
}

/** Infer charges from corridor labels / country_pair strings like "BG - RS". */
export function vignettesForCountryPairs(pairs: string[]): VignetteLink[] {
  const codes = new Set<string>();
  for (const pair of pairs) {
    for (const part of pair.split(/[-–—/]/)) {
      const code = part.trim().toUpperCase();
      if (code.length === 2) codes.add(code);
    }
  }
  return OFFICIAL_VIGNETTE_LINKS.filter((v) => codes.has(v.country_code));
}
