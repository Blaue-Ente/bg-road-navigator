import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import type { BorderCrossing } from "@/lib/constants/border-crossings";
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
  reasonCode: "lowest_total" | "slower_than_best" | "preferred" | "serbia_hungary";
  reason: string;
}

const MAX_LATERAL_KM = 170;
const MAX_CANDIDATES = 4;
export const HUNGARY_SERBIA_ON_ROUTE_KM = 30;

/**
 * Bulgarian crossings that sit between the two ends of the trip.
 * Same-country trips do not get a forced border. Nakordoni waits are applied later.
 */
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

  const ranked: BorderCandidate[] = [];
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

  ranked.sort((a, b) => a.lateralKm - b.lateralKm);
  return ranked.slice(0, MAX_CANDIDATES);
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

/** Lowest drive + wait + community penalty. Reasons compare each loser with the winner. */
export function scoreBorderOptions(
  options: BorderScoreInput[]
): ScoredBorder[] {
  if (options.length === 0) return [];
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
      ? chosenReason(option)
      : `С ${option.totalMin - best.totalMin} мин повече от ${best.nameBg}: ${option.driveMin} мин път и ${option.wait.minutes} мин ${waitNoun(option.wait)} (${option.wait.label_bg}).`;
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
  preferredId: string | null
): ScoredBorder[] {
  if (!preferredId) return scored;
  if (!scored.some((border) => border.borderId === preferredId)) return scored;
  return scored.map((border) => {
    const chosen = border.borderId === preferredId;
    if (!chosen) return { ...border, chosen: false };
    return {
      ...border,
      chosen: true,
      reasonCode: "preferred",
      reason: `Предпочитан граничен пункт: ${border.nameBg}.`,
    };
  });
}

function chosenReason(option: BorderScoreInput & { totalMin: number }): string {
  const penalty =
    option.communityPenaltyMin > 0
      ? ` Сигнали по пътя добавят ${option.communityPenaltyMin} мин.`
      : "";
  return `Най-малко общо време през ${option.nameBg}: ${option.driveMin} мин път и ${option.wait.minutes} мин ${waitNoun(option.wait)}.${penalty}`;
}

function waitNoun(wait: WaitEstimate): string {
  if (wait.metric === "typical_queue") return "типична опашка";
  if (wait.source === "unavailable") return "без данни за чакане";
  return "чакане";
}
