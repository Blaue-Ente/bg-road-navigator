/**
 * Official vignette and distance-toll links only.
 * Do not scrape, and do not link resellers or intermediaries.
 */

export type RoadChargeKind = "vignette" | "distance_toll";

import type { Locale } from "@/lib/i18n/locale";
import { catalog } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { Localized } from "@/lib/i18n/localized-field";
import { pickText } from "@/lib/i18n/localized-field";

export interface VignetteLink {
  country_code: string;
  kind: RoadChargeKind;
  name: Localized;
  name_bg: string;
  name_en: string;
  official_url: string;
  link_role: "shop" | "info";
  notes?: Localized;
  notes_bg?: string;
  notes_en?: string;
  validity?: Localized;
  /** Product durations copied from the official shop page — never prices. */
  validity_bg?: string;
  /** Day the official page was read (YYYY-MM-DD). */
  checked_on?: string;
}

export function formatVignetteValidity(
  link: VignetteLink,
  locale: Locale = "bg"
): string | null {
  if (!link.validity_bg?.trim() || !link.checked_on?.trim()) return null;
  const validityText = link.validity
    ? pickText(locale, link.validity)
    : link.validity_bg.trim();
  if (!validityText) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(link.checked_on.trim());
  const checked =
    match != null
      ? `${Number(match[3])}.${Number(match[2])}.${match[1]}`
      : link.checked_on.trim();
  return formatTemplate(catalog(locale).vignetteFormat.validityTemplate, {
    checked,
    validity: validityText,
  });
}

const VIGNETTE_ROWS: Omit<
  VignetteLink,
  "name_bg" | "name_en" | "notes_bg" | "notes_en" | "validity_bg"
>[] = [
  {
    country_code: "BG",
    kind: "vignette",
    name: {
      bg: "България — електронна винетка",
      en: "Bulgaria e-vignette",
      tr: "Bulgaristan — elektronik vinyet",
      ro: "Bulgaria — rovinietă electronică",
    },
    official_url: "https://web.bgtoll.bg/",
    link_role: "shop",
    notes: {
      bg: "Купувайте на web.bgtoll.bg. Обща информация: https://www.bgtoll.bg/",
      en: "Buy on web.bgtoll.bg. General information: https://www.bgtoll.bg/",
      tr: "web.bgtoll.bg üzerinden satın alın. Genel bilgi: https://www.bgtoll.bg/",
      ro: "Cumpărați de pe web.bgtoll.bg. Informații generale: https://www.bgtoll.bg/",
    },
  },
  {
    country_code: "AT",
    kind: "vignette",
    name: {
      bg: "Австрия — ASFINAG винетка",
      en: "Austria ASFINAG vignette",
      tr: "Avusturya ASFINAG vinyeti",
      ro: "Austria — vignetă ASFINAG",
    },
    official_url: "https://shop.asfinag.at/",
    link_role: "shop",
    notes: {
      bg: "Дигитална или стикер винетка + GO-Box за тежък трафик.",
      en: "Digital or sticker vignette plus GO-Box for heavy traffic.",
      tr: "Dijital veya yapışkan vinyet; ağır trafik için GO-Box.",
      ro: "Vignetă digitală sau autocolant plus GO-Box pentru trafic greu.",
    },
  },
  {
    country_code: "HU",
    kind: "vignette",
    name: {
      bg: "Унгария — e-matrica / HU-GO",
      en: "Hungary e-vignette / HU-GO",
      tr: "Macaristan e-vinyet / HU-GO",
      ro: "Ungaria — e-rovinieta / HU-GO",
    },
    official_url: "https://ematrica.nemzetiutdij.hu/en/vignette-purchase/",
    link_role: "shop",
    notes: {
      bg: "Леки автомобили: e-matrica. Камиони: HU-GO.",
      en: "Cars: e-matrica. Trucks: HU-GO.",
      tr: "Binek araçlar: e-matrica. Kamyonlar: HU-GO.",
      ro: "Autoturisme: e-matrica. Camioane: HU-GO.",
    },
  },
  {
    country_code: "CH",
    kind: "vignette",
    name: {
      bg: "Швейцария — е-винетка",
      en: "Switzerland e-vignette",
      tr: "İsviçre e-vinyeti",
      ro: "Elveția — e-vignetă",
    },
    official_url: "https://via.admin.ch/shop",
    link_role: "shop",
    notes: {
      bg: "Годишна е-винетка от официалния магазин Via. Ако страницата не се отвори, отворете я в обикновен браузър.",
      en: "Annual e-vignette from the official Via shop. If the page does not open, try a regular browser.",
      tr: "Resmî Via mağazasından yıllık e-vinyet. Sayfa açılmazsa normal tarayıcıda deneyin.",
      ro: "E-vignetă anuală din magazinul oficial Via. Dacă pagina nu se deschide, încercați un browser obișnuit.",
    },
  },
  {
    country_code: "SI",
    kind: "vignette",
    name: {
      bg: "Словения — e-vinjeta",
      en: "Slovenia e-vignette",
      tr: "Slovenya e-vinyeti",
      ro: "Slovenia — e-rovinieta",
    },
    official_url: "https://evinjeta.dars.si/en",
    link_role: "shop",
    notes: {
      bg: "Официален магазин на DARS.",
      en: "Official DARS shop.",
      tr: "Resmî DARS mağazı.",
      ro: "Magazinul oficial DARS.",
    },
  },
  {
    country_code: "CZ",
    kind: "vignette",
    name: {
      bg: "Чехия — електронна винетка",
      en: "Czech e-vignette",
      tr: "Çekya e-vinyeti",
      ro: "Cehia — e-vignetă",
    },
    official_url: "https://edalnice.gov.cz/",
    link_role: "shop",
    notes: {
      bg: "Официален магазин. edalnice.cz пренасочва тук.",
      en: "Official shop. edalnice.cz redirects here.",
      tr: "Resmî mağaz. edalnice.cz buraya yönlendirir.",
      ro: "Magazin oficial. edalnice.cz redirecționează aici.",
    },
    validity: {
      bg: "годишна, месечна или 10-дневна електронна винетка",
      en: "annual, monthly, or 10-day electronic vignette",
      tr: "yıllık, aylık veya 10 günlük elektronik vinyet",
      ro: "rovinietă electronică anuală, lunară sau de 10 zile",
    },
    checked_on: "2026-11-15",
  },
  {
    country_code: "SK",
    kind: "vignette",
    name: {
      bg: "Словакия — eznamka",
      en: "Slovakia eznamka",
      tr: "Slovakya eznamka",
      ro: "Slovacia — eznamka",
    },
    official_url: "https://www.eznamka.sk/",
    link_role: "shop",
    notes: {
      bg: "Електронна винетка за магистрали.",
      en: "Electronic vignette for motorways.",
      tr: "Otoyollar için elektronik vinyet.",
      ro: "Rovinieta electronică pentru autostrăzi.",
    },
  },
  {
    country_code: "RO",
    kind: "vignette",
    name: {
      bg: "Румъния — rovinieta",
      en: "Romania rovinieta",
      tr: "Romanya rovinieta",
      ro: "România — rovinietă",
    },
    official_url: "https://portal.etoll.ro/vinieta-ro",
    link_role: "shop",
    notes: {
      bg: "Rovinieta се купува през eToll / TollRo. Не купувайте от препродавачи.",
      en: "Buy the rovinieta via eToll / TollRo. Do not buy from resellers.",
      tr: "Rovinietayı eToll / TollRo üzerinden alın. Aracılardan satın almayın.",
      ro: "Rovinieta se cumpără prin eToll / TollRo. Nu cumpărați de la revânzători.",
    },
  },
  {
    country_code: "RS",
    kind: "distance_toll",
    name: {
      bg: "Сърбия — тол на километър",
      en: "Serbia distance toll",
      tr: "Sırbistan kilometre bazlı geçiş",
      ro: "Serbia — taxă pe km",
    },
    official_url:
      "https://www.putevi-srbije.rs/index.php/en/etc-elektronic-toll-collection",
    link_role: "info",
    notes: {
      bg: "Няма винетка. Магистралите се плащат по изминато разстояние на бариерите на Пътища Сърбия — в брой, с карта или с ENP таг.",
      en: "No vignette. Motorways are paid per kilometre at Putevi Srbije barriers — cash, card, or ENP tag.",
      tr: "Vinyet yok. Otoyollar, Sırbistan Karayolları gişelerinde kilometresi ücretlenir — nakit, kart veya ENP etiketi.",
      ro: "Fără rovinietă. Autostrăzile se plătesc pe kilometru la punctele Drumuri Serbia — numerar, card sau etichetă ENP.",
    },
  },
  {
    country_code: "HR",
    kind: "distance_toll",
    name: {
      bg: "Хърватия — тол на километър",
      en: "Croatia distance toll",
      tr: "Hırvatistan kilometre bazlı geçiş",
      ro: "Croația — taxă pe km",
    },
    official_url: "https://www.hac.hr/en/toll/etc",
    link_role: "info",
    notes: {
      bg: "Няма винетка за леки коли. Hrvatske autoceste събира тол по отсечки — на бариера или с ENC устройство.",
      en: "No vignette for cars. Hrvatske autoceste charges toll per section — at the barrier or with an ENC device.",
      tr: "Binek araçlar için vinyet yok. Hrvatske autoceste geçiş ücretini kesim başına alır — gişede veya ENC cihazıyla.",
      ro: "Fără rovinietă pentru autoturisme. Hrvatske autoceste percepe taxa pe segment — la barieră sau cu dispozitiv ENC.",
    },
  },
  {
    country_code: "TR",
    kind: "distance_toll",
    name: {
      bg: "Турция — HGS тол",
      en: "Turkey HGS toll",
      tr: "Türkiye HGS geçişi",
      ro: "Turcia — taxă HGS",
    },
    official_url: "https://hgsmusteri.ptt.gov.tr/",
    link_role: "shop",
    notes: {
      bg: "Няма винетка. Мостове и магистрали се плащат с HGS (PTT) по тарифа на KGM. Чужди номера се регистрират преди пътуване.",
      en: "No vignette. Bridges and motorways use HGS (PTT) at KGM rates. Register foreign plates before travel.",
      tr: "Vinyet yok. Köprü ve otoyollar HGS (PTT) ile KGM tarifesine göre ödenir. Yabancı plakaları yola çıkmadan önce kaydedin.",
      ro: "Fără rovinietă. Podurile și autostrăzile se plătesc cu HGS (PTT) după tariful KGM. Înregistrați plăcuțele străine înainte de drum.",
    },
  },
];

export const OFFICIAL_VIGNETTE_LINKS: VignetteLink[] = VIGNETTE_ROWS.map(
  (row) => ({
    ...row,
    name_bg: row.name.bg,
    name_en: row.name.en,
    notes_bg: row.notes?.bg,
    notes_en: row.notes?.en,
    validity_bg: row.validity?.bg,
  })
);

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