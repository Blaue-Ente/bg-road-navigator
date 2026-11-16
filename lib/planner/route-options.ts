import { borderDisplayName } from "@/lib/constants/border-crossings";
import { haversineKm } from "@/lib/geo/haversine";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";
import { formatTemplate } from "@/lib/i18n/format-template";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { countriesAlongRoute } from "@/lib/geo/countries-along-route";
import type { ScoredBorder } from "@/lib/planner/borders";
import {
  distanceToPolylineKm,
  lineLengthKm,
  pointAtDistance,
} from "@/lib/planner/line";
import type { TripPreferences } from "@/lib/planner/preferences";
import type {
  RouteChoice,
  RouteOptionsBlock,
  RouteOptionSummary,
} from "@/lib/planner/types";
import { getRouteTolls } from "@/lib/utils/route-tolls";
import type { GeoPoint } from "@/types/route.types";

const SAMPLE_KM = 10;
const OFF_LINE_KM = 15;
const MEANINGFUL_DIVERGENT_KM = 80;
const BORDER_DISTANCE_DELTA_KM = 40;
export const ON_PATH_KM = 12;

export function divergentSampleKm(
  primary: Array<[number, number]>,
  candidate: Array<[number, number]>
): number {
  const length = lineLengthKm(candidate);
  if (length <= 0 || primary.length < 2) return 0;
  let offSamples = 0;
  for (let km = 0; km <= length; km += SAMPLE_KM) {
    const sample = pointAtDistance(candidate, km);
    const { distanceKm } = distanceToPolylineKm(primary, sample);
    if (distanceKm > OFF_LINE_KM) offSamples++;
  }
  return offSamples * SAMPLE_KM;
}

export function isMeaningfulDivergence(
  primary: Array<[number, number]>,
  candidate: Array<[number, number]>,
  meta?: {
    primaryBorderId: string | null;
    candidateBorderId: string | null;
    primaryDistanceKm: number;
    candidateDistanceKm: number;
  }
): boolean {
  if (divergentSampleKm(primary, candidate) >= MEANINGFUL_DIVERGENT_KM) {
    return true;
  }
  if (!meta) return false;
  if (
    meta.primaryBorderId &&
    meta.candidateBorderId &&
    meta.primaryBorderId !== meta.candidateBorderId &&
    Math.abs(meta.primaryDistanceKm - meta.candidateDistanceKm) >=
      BORDER_DISTANCE_DELTA_KM
  ) {
    return true;
  }
  return false;
}

function chargeCodes(geometry: GeoJSON.LineString, ends: RouteEnds): {
  vignette_codes: string[];
  toll_codes: string[];
  countries: string[];
} {
  const tolls = getRouteTolls({
    geometry,
    origin: { coords: ends.origin },
    destination: { coords: ends.destination },
  });
  const vignette_codes: string[] = [];
  const toll_codes: string[] = [];
  for (const row of tolls) {
    if (row.kind === "vignette") vignette_codes.push(row.country_code);
    else toll_codes.push(row.country_code);
  }
  const countries = countriesAlongRoute({
    geometry,
    origin: { coords: ends.origin },
    destination: { coords: ends.destination },
  });
  return { vignette_codes, toll_codes, countries };
}

interface RouteEnds {
  origin: GeoPoint;
  destination: GeoPoint;
}

export interface BuildRouteOptionsInput {
  origin: GeoPoint;
  destination: GeoPoint;
  originCountry: string | null;
  destinationCountry: string | null;
  direct: ProvidedRoadRoute;
  viaRoutes: Map<string, ProvidedRoadRoute>;
  onPath: Set<string>;
  borders: ScoredBorder[];
  chosenRoute: ProvidedRoadRoute;
  chosenBorder: ScoredBorder | null;
  preferences: TripPreferences;
  activeChoice?: RouteChoice | null;
  locale?: Locale;
}

export function buildRouteOptions(
  input: BuildRouteOptionsInput
): RouteOptionsBlock {
  const locale = input.locale ?? "bg";
  const labels = catalog(locale).planner.routeLabel;
  const primaryLine = input.chosenRoute.geometry.coordinates as Array<
    [number, number]
  >;
  const chosenId = input.chosenBorder?.borderId ?? null;
  const primaryWait = input.chosenBorder?.wait.minutes ?? 0;
  const primaryCommunity = input.chosenBorder?.communityPenaltyMin ?? 0;
  const primaryTotal =
    input.chosenRoute.duration_min + primaryWait + primaryCommunity;

  const primaryLabel = input.chosenBorder
    ? formatTemplate(labels.via, {
        name: borderDisplayName(locale, {
          id: input.chosenBorder.borderId,
          name_bg: input.chosenBorder.nameBg,
          name_en: input.chosenBorder.nameEn,
        }),
      })
    : labels.direct;

  const primaryCharges = chargeCodes(input.chosenRoute.geometry, {
    origin: input.origin,
    destination: input.destination,
  });

  const primary: RouteOptionSummary = {
    id: "primary",
    role: "primary",
    source: chosenId && !input.onPath.has(chosenId) ? "border" : "direct",
    border_id: chosenId,
    label: primaryLabel,
    distance_km: Math.round(input.chosenRoute.distance_km),
    drive_min: Math.round(input.chosenRoute.duration_min),
    wait_min: primaryWait,
    total_min: Math.round(primaryTotal),
    countries: primaryCharges.countries,
    vignette_codes: primaryCharges.vignette_codes,
    toll_codes: primaryCharges.toll_codes,
    geometry: input.chosenRoute.geometry,
  };

  const unavailable = resolveUnavailableReason(input);
  if (unavailable) {
    return { primary, alternative: null, unavailable_reason: unavailable };
  }

  const avoidCosting =
    input.preferences.avoid_motorways || input.preferences.avoid_tolls;

  const borderAlt = pickBorderAlternative(input, primaryLine, chosenId, locale);
  if (borderAlt) {
    return {
      primary,
      alternative: borderAlt,
      unavailable_reason: null,
    };
  }

  if (avoidCosting) {
    return { primary, alternative: null, unavailable_reason: "constraints" };
  }

  const valhallaAlt = pickValhallaAlternative(input, primaryLine, chosenId, locale);
  if (valhallaAlt) {
    return { primary, alternative: valhallaAlt, unavailable_reason: null };
  }

  return { primary, alternative: null, unavailable_reason: "no_divergent_path" };
}

function resolveUnavailableReason(
  input: BuildRouteOptionsInput
): RouteOptionsBlock["unavailable_reason"] {
  if (
    input.originCountry &&
    input.destinationCountry &&
    input.originCountry === input.destinationCountry
  ) {
    return "same_country";
  }
  if (haversineKm(input.origin, input.destination) < 40) {
    return "too_short";
  }
  return null;
}

function pickBorderAlternative(
  input: BuildRouteOptionsInput,
  primaryLine: Array<[number, number]>,
  chosenId: string | null,
  locale: Locale
): RouteOptionSummary | null {
  const labels = catalog(locale).planner.routeLabel;
  const losers = input.borders
    .filter((border) => border.borderId !== chosenId)
    .sort((a, b) => a.totalMin - b.totalMin || a.driveMin - b.driveMin);

  for (const border of losers) {
    const routed = input.onPath.has(border.borderId)
      ? input.direct
      : input.viaRoutes.get(border.borderId);
    if (!routed) continue;
    const line = routed.geometry.coordinates as Array<[number, number]>;
    if (
      !isMeaningfulDivergence(primaryLine, line, {
        primaryBorderId: chosenId,
        candidateBorderId: border.borderId,
        primaryDistanceKm: input.chosenRoute.distance_km,
        candidateDistanceKm: routed.distance_km,
      })
    ) {
      continue;
    }
    const charges = chargeCodes(routed.geometry, {
      origin: input.origin,
      destination: input.destination,
    });
    return {
      id: "alternative",
      role: "alternative",
      source: "border",
      border_id: border.borderId,
      label: formatTemplate(labels.via, {
        name: borderDisplayName(locale, {
          id: border.borderId,
          name_bg: border.nameBg,
          name_en: border.nameEn,
        }),
      }),
      distance_km: Math.round(routed.distance_km),
      drive_min: Math.round(routed.duration_min),
      wait_min: border.wait.minutes,
      total_min: Math.round(border.totalMin),
      countries: charges.countries,
      vignette_codes: charges.vignette_codes,
      toll_codes: charges.toll_codes,
      geometry: routed.geometry,
    };
  }
  return null;
}

function pickValhallaAlternative(
  input: BuildRouteOptionsInput,
  primaryLine: Array<[number, number]>,
  chosenId: string | null,
  locale: Locale
): RouteOptionSummary | null {
  const labels = catalog(locale).planner.routeLabel;
  const alt = input.direct.alternatives[0];
  if (!alt) return null;
  const line = alt.geometry.coordinates as Array<[number, number]>;
  if (
    !isMeaningfulDivergence(primaryLine, line, {
      primaryBorderId: chosenId,
      candidateBorderId: null,
      primaryDistanceKm: input.chosenRoute.distance_km,
      candidateDistanceKm: alt.distance_km,
    })
  ) {
    return null;
  }

  let waitMin = 0;
  let label = labels.alternative;
  let borderId: string | null = null;
  for (const border of input.borders) {
    const near = distanceToPolylineKm(line, border.coords).distanceKm;
    if (near <= ON_PATH_KM) {
      waitMin = border.wait.minutes;
      borderId = border.borderId;
      label = formatTemplate(labels.via, {
        name: borderDisplayName(locale, {
          id: border.borderId,
          name_bg: border.nameBg,
          name_en: border.nameEn,
        }),
      });
      break;
    }
  }

  const geometry: GeoJSON.LineString = alt.geometry;
  const routeLike: ProvidedRoadRoute = {
    provider: input.direct.provider,
    distance_km: alt.distance_km,
    duration_min: alt.duration_min,
    geometry,
    maneuvers: alt.maneuvers,
    alternatives: [],
  };
  const charges = chargeCodes(geometry, {
    origin: input.origin,
    destination: input.destination,
  });

  return {
    id: "alternative",
    role: "alternative",
    source: "valhalla",
    border_id: borderId,
    label,
    distance_km: Math.round(routeLike.distance_km),
    drive_min: Math.round(routeLike.duration_min),
    wait_min: waitMin,
    total_min: Math.round(routeLike.duration_min + waitMin),
    countries: charges.countries,
    vignette_codes: charges.vignette_codes,
    toll_codes: charges.toll_codes,
    geometry,
  };
}

export function routeChoiceFromAlternative(
  alt: RouteOptionSummary
): RouteChoice {
  if (alt.source === "border" && alt.border_id) {
    return { kind: "border", border_id: alt.border_id };
  }
  return { kind: "valhalla_alternate" };
}

export function isActivePrimary(
  options: RouteOptionsBlock,
  active?: RouteChoice | null
): boolean {
  if (!active) return true;
  if (active.kind === "valhalla_alternate") {
    return options.primary.source === "direct" || options.primary.source === "valhalla";
  }
  return options.primary.border_id === active.border_id;
}