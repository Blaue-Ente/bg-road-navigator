/**
 * Official border link-outs and the Hárinfó name → crossing map.
 * Links only: nothing here fetches AMSS, UND, or MUP images.
 */

export const RS_BORDER_CAMERAS_URL =
  "https://www.mup.gov.rs/wps/portal/sr/kamere";

export const BG_BORDER_BULLETIN_URL =
  "https://www.mvr.bg/gdgp/информационен-център/пресцентър/ежедневен-трафик-по-гкпп";

export const RO_BORDER_TRAFFIC_URL =
  "https://www.politiadefrontiera.ro/ro/traficonline";

export const MFA_TRAVEL_ADVICE_URL =
  "https://www.mfa.bg/bg/uslugi-patuvania/konsulski-uslugi/patuvane-chujbina";

export const HATARINFO_PAGE_URL =
  "https://www.police.hu/hu/hirek-es-informaciok/hatarinfo?field_hat_rszakasz_value=szerb%20hat%C3%A1rszakasz";

export const HATARINFO_ATTRIBUTION_TEXT =
  "Източник: Унгарска полиция (Hárinfó)";

export const HATARINFO_ATTRIBUTION = {
  text: HATARINFO_ATTRIBUTION_TEXT,
  href: HATARINFO_PAGE_URL,
  terms: "https://www.police.hu/",
} as const;

export const OFFICIAL_LINK_LABELS = {
  cameras: "Виж камерите",
  bulletin: "Бюлетин на Гранична полиция",
  romania: "Трафик онлайн",
} as const;

export interface OfficialBorderLink {
  kind: "cameras" | "bulletin" | "romania";
  href: string;
  label_bg: string;
}

/**
 * Serbian MUP publishes one camera portal (Gradina, Horgoš, Preševo, and the
 * other road crossings). The card links to that page; it does not load a still.
 */
export const MUP_CAMERA_CROSSING_IDS = [
  "gradina",
  "horgos",
  "horgos-road",
  "tompa",
  "hercegszanto",
  "presevo",
  "batrovci",
  "kalotina",
] as const;

/** 24-hour international car crossings offered when a trip chooses a RS–HU post. */
export const HUNGARY_SERBIA_PLANNER_IDS = [
  "horgos",
  "horgos-road",
  "tompa",
  "hercegszanto",
] as const;

/** Every Serbian-section post the Hárinfó parser can name, including restricted ones. */
export const HATARINFO_CROSSING_IDS = [
  "horgos",
  "horgos-road",
  "tompa",
  "hercegszanto",
  "asotthalom",
  "bacsalmas",
  "bacsszentgyorgy",
  "kubehaza",
  "tiszasziget",
] as const;

const HATARINFO_NAME_RULES: Array<{ id: string; parts: string[] }> = [
  { id: "horgos-road", parts: ["roszke", "kozut"] },
  { id: "horgos", parts: ["roszke"] },
  { id: "tompa", parts: ["tompa"] },
  { id: "hercegszanto", parts: ["hercegszanto"] },
  { id: "asotthalom", parts: ["asotthalom"] },
  { id: "bacsalmas", parts: ["bacsalmas"] },
  { id: "bacsszentgyorgy", parts: ["bacsszentgyorgy"] },
  { id: "kubehaza", parts: ["kubekhaza"] },
  { id: "tiszasziget", parts: ["tiszasziget"] },
];

export function isHungarySerbiaPlannerId(id: string): boolean {
  return (HUNGARY_SERBIA_PLANNER_IDS as readonly string[]).includes(id);
}

export function isHatarinfoCrossingId(id: string): boolean {
  return (HATARINFO_CROSSING_IDS as readonly string[]).includes(id);
}

export function foldBorderName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function crossingIdForHatarinfoName(name: string): string | null {
  const folded = foldBorderName(name);
  for (const rule of HATARINFO_NAME_RULES) {
    if (rule.parts.every((part) => folded.includes(part))) return rule.id;
  }
  return null;
}

export function officialLinksForCrossing(crossing: {
  id: string;
  country_pair: string;
}): OfficialBorderLink[] {
  const sides = crossing.country_pair
    .split("-")
    .map((side) => side.trim().toUpperCase())
    .filter(Boolean);
  const links: OfficialBorderLink[] = [];
  if (sides.includes("RS")) {
    links.push({
      kind: "cameras",
      href: RS_BORDER_CAMERAS_URL,
      label_bg: OFFICIAL_LINK_LABELS.cameras,
    });
  }
  if (sides.includes("BG")) {
    links.push({
      kind: "bulletin",
      href: BG_BORDER_BULLETIN_URL,
      label_bg: OFFICIAL_LINK_LABELS.bulletin,
    });
  }
  if (sides.includes("RO")) {
    links.push({
      kind: "romania",
      href: RO_BORDER_TRAFFIC_URL,
      label_bg: OFFICIAL_LINK_LABELS.romania,
    });
  }
  return links;
}
