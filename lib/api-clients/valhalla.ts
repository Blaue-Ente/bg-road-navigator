/**
 * Valhalla 3.x route client (costing `auto`).
 * Shapes are polyline6. The mapped result matches the OSRM road-route shape.
 */

import { decodePolyline } from "@/lib/geo/polyline";
import {
  failureFromError,
  failureFromStatus,
  ociFetch,
  VALHALLA_TIMEOUT_MS,
  type OciGeoConfig,
  type UpstreamFailure,
} from "@/lib/api-clients/oci-geo";
import type {
  RoadRoute,
  RoadRouteAlternative,
} from "@/lib/api-clients/road-route";
import type { Locale } from "@/lib/i18n/locale";
import { valhallaLanguage } from "@/lib/i18n/locale";
import { maneuverInstructionBg } from "@/lib/utils/maneuvers";
import type { RouteManeuver } from "@/types/route.types";

const KM_PER_MILE = 1.609344;
const MAX_MANEUVERS = 80;
const MAX_ALTERNATES = 2;

interface ValhallaManeuver {
  type?: number;
  instruction?: string;
  street_names?: string[];
  length?: number;
  time?: number;
  begin_shape_index?: number;
  roundabout_exit_count?: number;
}

interface ValhallaLeg {
  shape?: string;
  summary?: { length?: number; time?: number };
  maneuvers?: ValhallaManeuver[];
}

interface ValhallaTrip {
  status?: number;
  units?: string;
  summary?: { length?: number; time?: number; cost?: number };
  legs?: ValhallaLeg[];
}

interface ValhallaResponse {
  trip?: ValhallaTrip;
  alternates?: unknown[];
}

const MANEUVER_TYPES: Record<number, { type: string; modifier?: string }> = {
  0: { type: "notification" },
  1: { type: "depart" },
  2: { type: "depart", modifier: "right" },
  3: { type: "depart", modifier: "left" },
  4: { type: "arrive" },
  5: { type: "arrive", modifier: "right" },
  6: { type: "arrive", modifier: "left" },
  7: { type: "new name" },
  8: { type: "continue", modifier: "straight" },
  9: { type: "turn", modifier: "slight right" },
  10: { type: "turn", modifier: "right" },
  11: { type: "turn", modifier: "sharp right" },
  12: { type: "turn", modifier: "uturn" },
  13: { type: "turn", modifier: "uturn" },
  14: { type: "turn", modifier: "sharp left" },
  15: { type: "turn", modifier: "left" },
  16: { type: "turn", modifier: "slight left" },
  17: { type: "on ramp", modifier: "straight" },
  18: { type: "on ramp", modifier: "right" },
  19: { type: "on ramp", modifier: "left" },
  20: { type: "off ramp", modifier: "right" },
  21: { type: "off ramp", modifier: "left" },
  22: { type: "fork", modifier: "straight" },
  23: { type: "fork", modifier: "right" },
  24: { type: "fork", modifier: "left" },
  25: { type: "merge" },
  26: { type: "roundabout" },
  27: { type: "exit roundabout" },
  28: { type: "notification" },
  29: { type: "notification" },
  37: { type: "merge", modifier: "right" },
  38: { type: "merge", modifier: "left" },
};

export interface ValhallaAttempt {
  ok: true;
  route: RoadRoute;
}

export interface ValhallaMiss {
  ok: false;
  outcome: UpstreamFailure;
}

export interface ValhallaCosting {
  useHighways?: boolean;
  useTolls?: boolean;
}

export function buildValhallaRouteBody(
  coords: Array<{ lng: number; lat: number; type?: "break" | "through" }>,
  costing?: ValhallaCosting,
  locale: Locale = "bg"
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    locations: coords.map((point) => ({
      lon: point.lng,
      lat: point.lat,
      type: point.type ?? "break",
    })),
    costing: "auto",
    units: "kilometers",
    language: valhallaLanguage(locale),
  };
  const auto: Record<string, number> = {};
  if (costing?.useHighways === false) auto.use_highways = 0;
  if (costing?.useTolls === false) auto.use_tolls = 0;
  if (Object.keys(auto).length > 0) {
    body.costing_options = { auto };
  }
  // Valhalla only returns alternates for a single origin/destination pair.
  if (coords.length === 2) body.alternates = MAX_ALTERNATES;
  return body;
}

export function mapValhallaResponse(
  payload: unknown,
  locale: Locale = "bg"
): RoadRoute | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as ValhallaResponse;
  const primary = mapTrip(data.trip, locale);
  if (!primary) return null;
  const alternatives = (data.alternates ?? [])
    .map((item) => mapTrip(unwrapTrip(item), locale))
    .filter((route): route is RoadRoute => route != null)
    .slice(0, MAX_ALTERNATES)
    .map((route, index) => toAlternative(route, index));
  return { ...primary, alternatives };
}

export async function fetchValhallaRoute(
  coords: Array<{ lng: number; lat: number }>,
  config: OciGeoConfig,
  costing?: ValhallaCosting,
  locale: Locale = "bg"
): Promise<ValhallaAttempt | ValhallaMiss> {
  if (coords.length < 2) return { ok: false, outcome: "empty" };
  const url = `${config.baseUrl}/valhalla/route`;
  try {
    const response = await ociFetch(
      url,
      config.apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildValhallaRouteBody(coords, costing, locale)),
        next: { revalidate: 0 },
      },
      VALHALLA_TIMEOUT_MS
    );
    if (!response.ok || response.status >= 300) {
      return { ok: false, outcome: failureFromStatus(response.status) };
    }
    const route = mapValhallaResponse(await response.json(), locale);
    if (!route) return { ok: false, outcome: "empty" };
    return { ok: true, route };
  } catch (error) {
    return { ok: false, outcome: failureFromError(error) };
  }
}

function unwrapTrip(item: unknown): ValhallaTrip | undefined {
  if (!item || typeof item !== "object") return undefined;
  const record = item as { trip?: ValhallaTrip; legs?: unknown };
  if (record.trip) return record.trip;
  if (Array.isArray(record.legs)) return record as ValhallaTrip;
  return undefined;
}

function mapTrip(
  trip: ValhallaTrip | undefined,
  locale: Locale = "bg"
): RoadRoute | null {
  if (!trip) return null;
  if (typeof trip.status === "number" && trip.status !== 0) return null;
  const legs = trip.legs ?? [];
  if (legs.length === 0) return null;

  const miles = trip.units === "miles" || trip.units === "mi";
  const toKm = (length: number) => (miles ? length * KM_PER_MILE : length);
  const coordinates: Array<[number, number]> = [];
  const maneuvers: RouteManeuver[] = [];

  for (const leg of legs) {
    const shape = decodePolyline(leg.shape ?? "", 6);
    appendShape(coordinates, shape);
    if (maneuvers.length >= MAX_MANEUVERS) continue;
    for (const maneuver of leg.maneuvers ?? []) {
      const mapped = toManeuver(maneuver, shape, toKm, locale);
      if (!mapped) continue;
      maneuvers.push(mapped);
      if (maneuvers.length >= MAX_MANEUVERS) break;
    }
  }

  if (coordinates.length < 2) return null;

  const summaryKm =
    typeof trip.summary?.length === "number"
      ? toKm(trip.summary.length)
      : legs.reduce((sum, leg) => sum + toKm(leg.summary?.length ?? 0), 0);
  const summarySec =
    typeof trip.summary?.time === "number"
      ? trip.summary.time
      : legs.reduce((sum, leg) => sum + (leg.summary?.time ?? 0), 0);

  return {
    distance_km: Math.round(summaryKm),
    duration_min: Math.round(summarySec / 60),
    geometry: { type: "LineString", coordinates },
    maneuvers,
    alternatives: [],
  };
}

function toAlternative(route: RoadRoute, index: number): RoadRouteAlternative {
  return {
    distance_km: route.distance_km,
    duration_min: route.duration_min,
    geometry: route.geometry,
    weight: index + 1,
    maneuvers: route.maneuvers,
  };
}

function toManeuver(
  maneuver: ValhallaManeuver,
  shape: Array<[number, number]>,
  toKm: (length: number) => number,
  locale: Locale = "bg"
): RouteManeuver | null {
  const index = maneuver.begin_shape_index ?? 0;
  const point = shape[index] ?? shape[0];
  if (!point) return null;
  const mapped = MANEUVER_TYPES[maneuver.type ?? 8] ?? { type: "continue" };
  const street = maneuver.street_names?.find((name) => name.trim())?.trim();
  const exit =
    mapped.type === "roundabout" || mapped.type === "exit roundabout"
      ? maneuver.roundabout_exit_count
      : undefined;
  const built = maneuverInstructionBg({
    name: street,
    maneuver: { type: mapped.type, modifier: mapped.modifier, exit },
  });
  const valhallaText = maneuver.instruction?.trim();
  const instruction =
    locale !== "bg" && valhallaText
      ? valhallaText
      : mapped.type === "notification" && valhallaText
        ? valhallaText
        : built;
  return {
    instruction_bg: instruction,
    type: mapped.type,
    modifier: mapped.modifier,
    street,
    distance_m: Math.round(toKm(maneuver.length ?? 0) * 1000),
    duration_s: Math.round(maneuver.time ?? 0),
    coords: { lng: point[0], lat: point[1] },
  };
}

function appendShape(
  into: Array<[number, number]>,
  next: Array<[number, number]>
) {
  if (next.length === 0) return;
  const last = into[into.length - 1];
  const start = next[0];
  const duplicate =
    last &&
    start &&
    Math.abs(last[0] - start[0]) < 1e-6 &&
    Math.abs(last[1] - start[1]) < 1e-6;
  into.push(...(duplicate ? next.slice(1) : next));
}
