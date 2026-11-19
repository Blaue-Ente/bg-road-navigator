import {
  BORDER_CROSSINGS,
  borderDisplayName,
} from "@/lib/constants/border-crossings";
import type { BorderCrossing } from "@/lib/constants/border-crossings";
import { preferenceBorderById } from "@/lib/constants/preference-borders";
import { formatTemplate } from "@/lib/i18n/format-template";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { HUNGARY_SERBIA_PLANNER_IDS } from "@/lib/constants/border-official-links";
import { getCrossingsByIds } from "@/lib/constants/european-borders";
import { haversineKm } from "@/lib/geo/haversine";
import { distanceToPolylineKm, distanceToSegmentKm } from "@/lib/planner/line";
import type { WaitEstimate } from "@/lib/planner/types";
import type { GeoPoint } from "@/types/route.types";

export interface BorderCandidate {
  id: string;
  nameBg: string;
  nameEn: string;
  coords: GeoPoint;
  ppid: string | null;
  countryPair: string;
  /** 24 local typical minutes, used only when Nakordoni cache has nothing. */
  localTypicalMinutes: number[];
  lateralKm: number;
}

export interface BorderScoreInput {
  borderId: string;
  nameBg: string;
  nameEn: string;
  coords: GeoPoint;
  ppid: string | null;
  driveMin: number;
  distanceKm: number;
  wait: WaitEstimate;
  communityPenaltyMin: number;
}

export interface ScoredBorder extends BorderScoreInput {
  totalMin: number;
  chosen: boolean;
  reasonCode:
    | "lowest_total"
    | "slower_than_best"
    | "preferred"
    | "serbia_hungary"
    | "on_path";
  reason: string;
}

const MAX_LATERAL_KM = 170;
const MAX_CANDIDATES = 4;
export const HUNGARY_SERBIA_ON_ROUTE_KM = 12;
export const ON_PATH_BORDER_KM = 12;

const BALKAN_TRANSIT = new Set(["TR", "GR", "MK", "BG"]);

/** Ends that force a Serbia–Hungary border comparison (not only on-path info). */
const FORCE_HU_RS_ENDS = new Set([
  "RS",
  "BG",
  "MK",
  "GR",
  "TR",
  "XK",
  "ME",
  "AL",
  "BA",
]);

/**
 * True when one end is in Bulgaria, or one end is in TR/GR/MK and the other is
 * outside {TR, GR, MK, BG}. Unknown country on either end keeps today's behaviour.
 */
export function tripMayCrossBulgaria(
  originCountry: string | null,
  destinationCountry: string | null
): boolean {
  if (!originCountry || !destinationCountry) return true;
  if (originCountry === "BG" || destinationCountry === "BG") return true;
  const originTransit = BALKAN_TRANSIT.has(originCountry);
  const destinationTransit = BALKAN_TRANSIT.has(destinationCountry);
  if (originTransit !== destinationTransit) {
    const other = originTransit ? destinationCountry : originCountry;
    return !BALKAN_TRANSIT.has(other);
  }
  return false;
}

export function tripMustForceHungarySerbiaBorderChoice(input: {
  originCountry?: string | null;
  destinationCountry?: string | null;
}): boolean {
  if (input.originCountry && FORCE_HU_RS_ENDS.has(input.originCountry)) {
    return true;
  }
  if (
    input.destinationCountry &&
    FORCE_HU_RS_ENDS.has(input.destinationCountry)
  ) {
    return true;
  }
  return false;
}

/**
 * Bulgarian crossings that sit between the two ends of the trip.
 * Same-country trips do not get a forced border. Nakordoni waits are applied later.
 */
export function borderCrossingToCandidate(
  crossing: BorderCrossing,
  lateralKm = 0
): BorderCandidate {
  return {
    id: crossing.id,
    nameBg: crossing.name_bg,
    nameEn: crossing.name_en,
    coords: crossing.coords,
    ppid: crossing.nakordoni_ppid ?? null,
    countryPair: crossing.country_pair,
    localTypicalMinutes: crossing.typical_wait_minutes,
    lateralKm: Math.round(lateralKm * 10) / 10,
  };
}

export function preferenceBorderCandidate(
  borderId: string,
  origin: GeoPoint,
  destination: GeoPoint
): BorderCandidate | null {
  const row = preferenceBorderById(borderId);
  if (!row) return null;
  const approach = distanceToSegmentKm(origin, destination, row.coords);
  return borderCrossingToCandidate(row, approach.distanceKm);
}

/** Closest BG crossing the driven line passes, for informational display only. */
export function onPathBulgarianCrossing(
  line: Array<[number, number]>
): BorderCandidate | null {
  let best: BorderCandidate | null = null;
  for (const crossing of BORDER_CROSSINGS) {
    const distanceKm = distanceToPolylineKm(line, crossing.coords).distanceKm;
    if (distanceKm > ON_PATH_BORDER_KM) continue;
    if (best && best.lateralKm <= distanceKm) continue;
    best = borderCrossingToCandidate(crossing, distanceKm);
  }
  return best;
}

export function selectCandidateBorders(input: {
  origin: GeoPoint;
  destination: GeoPoint;
  originCountry?: string | null;
  destinationCountry?: string | null;
}): BorderCandidate[] {
  if (
    input.originCountry &&
    input.destinationCountry &&
    input.originCountry === input.destinationCountry
  ) {
    return [];
  }
  if (haversineKm(input.origin, input.destination) < 40) return [];

  const ranked: Array<BorderCandidate & { minor: boolean }> = [];
  for (const crossing of BORDER_CROSSINGS) {
    if (haversineKm(input.origin, crossing.coords) < 8) continue;
    if (haversineKm(input.destination, crossing.coords) < 8) continue;
    const approach = distanceToSegmentKm(
      input.origin,
      input.destination,
      crossing.coords
    );
    if (approach.t < 0.03 || approach.t > 0.97) continue;
    if (approach.distanceKm > MAX_LATERAL_KM) continue;
    ranked.push({
      minor: crossing.minor === true,
      id: crossing.id,
      nameBg: crossing.name_bg,
      nameEn: crossing.name_en,
      coords: crossing.coords,
      ppid: crossing.nakordoni_ppid ?? null,
      countryPair: crossing.country_pair,
      localTypicalMinutes: crossing.typical_wait_minutes,
      lateralKm: Math.round(approach.distanceKm * 10) / 10,
    });
  }

  // Main crossings first, nearest to the line; small posts only fill what is left.
  ranked.sort(
    (a, b) => Number(a.minor === true) - Number(b.minor === true) || a.lateralKm - b.lateralKm
  );
  return ranked.slice(0, MAX_CANDIDATES).map(({ minor, ...candidate }) => {
    void minor;
    return candidate;
  });
}

/**
 * Serbia–Hungary posts that sit on the straight line. Used only when the
 * trip has no Bulgarian crossing to choose, so they are not alternatives
 * to Kalotina.
 */
export function selectHungarySerbiaBorders(input: {
  origin: GeoPoint;
  destination: GeoPoint;
  originCountry?: string | null;
  destinationCountry?: string | null;
}): BorderCandidate[] {
  if (
    input.originCountry &&
    input.destinationCountry &&
    input.originCountry === input.destinationCountry
  ) {
    return [];
  }
  if (haversineKm(input.origin, input.destination) < 40) return [];
  return rankBySegment(input.origin, input.destination, hungarySerbiaCatalog());
}

/** The planner post the driven line actually passes. */
export function nearestHungarySerbiaCrossing(
  line: Array<[number, number]>
): BorderCandidate | null {
  let best: BorderCandidate | null = null;
  for (const crossing of hungarySerbiaCatalog()) {
    const distanceKm = distanceToPolylineKm(line, crossing.coords).distanceKm;
    if (distanceKm > HUNGARY_SERBIA_ON_ROUTE_KM) continue;
    if (best && best.lateralKm <= distanceKm) continue;
    best = toCandidate(crossing, distanceKm);
  }
  return best;
}

/** Latitude band of the RS–HU frontier, wide enough for Sofia–Munich and Belgrade–Budapest. */
export function tripMayCrossHungarySerbia(input: {
  origin: GeoPoint;
  destination: GeoPoint;
  originCountry?: string | null;
  destinationCountry?: string | null;
}): boolean {
  if (
    input.originCountry &&
    input.destinationCountry &&
    input.originCountry === input.destinationCountry
  ) {
    return false;
  }
  const south = Math.min(input.origin.lat, input.destination.lat);
  const north = Math.max(input.origin.lat, input.destination.lat);
  if (south >= 46.5 || north <= 45.6) return false;
  const west = Math.min(input.origin.lng, input.destination.lng);
  const east = Math.max(input.origin.lng, input.destination.lng);
  return west <= 22 && east >= 16;
}

function hungarySerbiaCatalog(): BorderCrossing[] {
  return getCrossingsByIds([...HUNGARY_SERBIA_PLANNER_IDS]);
}

function rankBySegment(
  origin: GeoPoint,
  destination: GeoPoint,
  crossings: BorderCrossing[]
): BorderCandidate[] {
  const ranked: BorderCandidate[] = [];
  for (const crossing of crossings) {
    if (haversineKm(origin, crossing.coords) < 8) continue;
    if (haversineKm(destination, crossing.coords) < 8) continue;
    const approach = distanceToSegmentKm(origin, destination, crossing.coords);
    if (approach.t < 0.03 || approach.t > 0.97) continue;
    if (approach.distanceKm > MAX_LATERAL_KM) continue;
    ranked.push(toCandidate(crossing, approach.distanceKm));
  }
  ranked.sort((a, b) => a.lateralKm - b.lateralKm);
  return ranked.slice(0, MAX_CANDIDATES);
}

function toCandidate(crossing: BorderCrossing, lateralKm: number): BorderCandidate {
  return borderCrossingToCandidate(crossing, lateralKm);
}

function borderName(locale: Locale, option: BorderScoreInput): string {
  return borderDisplayName(locale, {
    id: option.borderId,
    name_bg: option.nameBg,
    name_en: option.nameEn,
  });
}

/** Lowest drive + wait + community penalty. Reasons compare each loser with the winner. */
export function scoreBorderOptions(
  options: BorderScoreInput[],
  locale: Locale = "bg"
): ScoredBorder[] {
  if (options.length === 0) return [];
  const b = catalog(locale).planner.border;
  const scored = options.map((option) => {
    const totalMin =
      option.driveMin + option.wait.minutes + option.communityPenaltyMin;
    return { ...option, totalMin };
  });
  scored.sort((a, b) => a.totalMin - b.totalMin || a.driveMin - b.driveMin);
  const best = scored[0]!;
  return scored.map((option) => {
    const chosen =
      option.borderId === best.borderId && option.totalMin === best.totalMin;
    const reason = chosen
      ? chosenReason(option, locale)
      : formatTemplate(b.slowerThanBest, {
          delta: String(option.totalMin - best.totalMin),
          name: borderName(locale, best),
          drive: String(option.driveMin),
          wait: String(option.wait.minutes),
          waitKind: waitNoun(option.wait, locale),
          waitLabel: option.wait.label_bg,
        });
    return {
      ...option,
      chosen,
      reasonCode: chosen ? "lowest_total" : "slower_than_best",
      reason,
    };
  });
}

/** A saved preferred crossing stays chosen when it was actually scored. */
export function applyPreferredBorder(
  scored: ScoredBorder[],
  preferredId: string | null,
  locale: Locale = "bg"
): ScoredBorder[] {
  if (!preferredId) return scored;
  if (!scored.some((border) => border.borderId === preferredId)) return scored;
  const b = catalog(locale).planner.border;
  return scored.map((border) => {
    const chosen = border.borderId === preferredId;
    if (!chosen) return { ...border, chosen: false };
    return {
      ...border,
      chosen: true,
      reasonCode: "preferred",
      reason: formatTemplate(b.preferred, {
        name: borderName(locale, border),
      }),
    };
  });
}

/** Recompute totals and chosen/slow reason text after the final border ETA wait is known. */
export function rescoreBordersAfterWaitUpdate(
  borders: ScoredBorder[],
  locale: Locale = "bg"
): ScoredBorder[] {
  const b = catalog(locale).planner.border;
  return borders.map((border) => {
    const totalMin =
      border.driveMin + border.wait.minutes + border.communityPenaltyMin;
    if (!border.chosen) {
      return { ...border, totalMin };
    }
    let reason = border.reason;
    if (border.reasonCode === "lowest_total") {
      reason = chosenReason({ ...border, totalMin }, locale);
    } else if (border.reasonCode === "preferred") {
      reason = formatTemplate(b.preferred, {
        name: borderName(locale, border),
      });
    }
    return { ...border, totalMin, reason };
  });
}

function chosenReason(
  option: BorderScoreInput & { totalMin: number },
  locale: Locale
): string {
  const b = catalog(locale).planner.border;
  const penalty =
    option.communityPenaltyMin > 0
      ? formatTemplate(b.communityPenalty, {
          minutes: String(option.communityPenaltyMin),
        })
      : "";
  return formatTemplate(b.lowestTotal, {
    name: borderName(locale, option),
    drive: String(option.driveMin),
    wait: String(option.wait.minutes),
    waitKind: waitNoun(option.wait, locale),
    penalty,
  });
}

function waitNoun(wait: WaitEstimate, locale: Locale): string {
  const w = catalog(locale).planner.wait;
  if (wait.metric === "typical_queue") return w.metricTypicalQueue;
  if (wait.source === "unavailable") return w.metricNoData;
  return w.metricWait;
}
