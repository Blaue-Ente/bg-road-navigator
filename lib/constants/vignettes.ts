/**
 * Official vignette / toll purchase deep links only.
 * Do not scrape — open government / concessionaire portals.
 */

export interface VignetteLink {
  country_code: string;
  name_bg: string;
  name_en: string;
  official_url: string;
  notes_bg?: string;
}

export const OFFICIAL_VIGNETTE_LINKS: VignetteLink[] = [
  {
    country_code: "BG",
    name_bg: "България — електронна винетка",
    name_en: "Bulgaria e-vignette",
    official_url: "https://www.bgtoll.bg/",
    notes_bg: "Официален портал BGTOLL.",
  },
  {
    country_code: "AT",
    name_bg: "Австрия — ASFINAG винетка",
    name_en: "Austria ASFINAG vignette",
    official_url: "https://shop.asfinag.at/",
    notes_bg: "Дигитална или стикер винетка + GO-Box за тежък трафик.",
  },
  {
    country_code: "HU",
    name_bg: "Унгария — e-matrica / HU-GO",
    name_en: "Hungary e-vignette / HU-GO",
    official_url: "https://www.nemzetiautoapalya.hu/en/e-vignette",
    notes_bg: "Леки автомобили: e-matrica. Камиони: HU-GO.",
  },
  {
    country_code: "CH",
    name_bg: "Швейцария — винетка",
    name_en: "Switzerland vignette",
    official_url:
      "https://www.astra.admin.ch/astra/en/home/running/motorways/vignette.html",
    notes_bg: "Годишна автомагистрална винетка (via swisspost / ASTRA).",
  },
  {
    country_code: "SI",
    name_bg: "Словения — e-vinjeta",
    name_en: "Slovenia e-vignette",
    official_url: "https://evinjeta.dars.si/",
    notes_bg: "Официален DARS портал.",
  },
  {
    country_code: "CZ",
    name_bg: "Чехия — електронна винетка",
    name_en: "Czech e-vignette",
    official_url: "https://edalnice.cz/",
    notes_bg: "edalnice.cz — официален магазин.",
  },
  {
    country_code: "SK",
    name_bg: "Словакия — eznamka",
    name_en: "Slovakia eznamka",
    official_url: "https://www.eznamka.sk/",
    notes_bg: "Електронна винетка за магистрали.",
  },
  {
    country_code: "RO",
    name_bg: "Румъния — rovinieta",
    name_en: "Romania rovinieta",
    official_url: "https://www.roviniete.ro/",
    notes_bg: "Официална електронна винетка.",
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
};

export function getVignetteByCountryCode(
  code: string
): VignetteLink | undefined {
  const normalized = code.trim().toUpperCase();
  const mapped = CODE_ALIASES[normalized] ?? normalized;
  return OFFICIAL_VIGNETTE_LINKS.find((v) => v.country_code === mapped);
}

/** Infer country codes from corridor labels / country_pair strings like "BG - RS". */
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
