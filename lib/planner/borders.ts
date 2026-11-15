import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import { haversineKm } from "@/lib/geo/haversine";
import { distanceToSegmentKm } from "@/lib/planner/line";
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
  reasonCode: "lowest_total" | "slower_than_best";
  reason: string;
}

const MAX_LATERAL_KM = 170;
const MAX_CANDIDATES = 4;

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
