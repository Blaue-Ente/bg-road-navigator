import { borderDisplayName } from "@/lib/constants/border-crossings";
import { isHungarySerbiaPlannerId } from "@/lib/constants/border-official-links";
import { fillLiters } from "@/lib/fuel-prices/advice";
import { DATEX_ATTRIBUTION } from "@/lib/hazards/present";
import type { RoadHazard } from "@/lib/hazards/types";
import { hotspotAttribution } from "@/lib/hotspots/present";
import type { Hotspot } from "@/lib/hotspots/types";
import { presentFuelStop, type KnownAverage } from "@/lib/fuel-prices/present";
import { getRouteTolls } from "@/lib/utils/route-tolls";
import { buildMapsHandoff, type MapStop } from "@/lib/utils/maps-handoff";
import type { SleepShift, TimedStop } from "@/lib/planner/breaks";
import {
  formatWakeLabel,
  wakeAt,
  wallClockEta,
} from "@/lib/planner/breaks";
import {
  timeZoneForCountry,
  timeZoneLabel,
} from "@/lib/geo/country-timezone";
import { unitsFrom } from "@/lib/i18n/units";
import { formatClockDuration } from "@/lib/planner/itinerary";
import { lineLengthKm, pointAtDistance } from "@/lib/planner/line";
import type { CommunityScore } from "@/lib/planner/community";
import type { ScoredBorder } from "@/lib/planner/borders";
import type {
  FuelAdvice,
  FuelCountryAverage,
  PlanChecklist,
  PlanPrice,
  PlanStop,
  PlaceFlagSummary,
  RouteWeather,
  TripPlannerResult,
  WhyReason,
} from "@/lib/planner/types";
import type { TripPreferences } from "@/lib/planner/preferences";
import { OSM_ATTRIBUTION } from "@/lib/planner/osm-attribution";
import type { ResolvedVehicle } from "@/lib/planner/vehicle";
import type { GeoPoint } from "@/types/route.types";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { MessageCatalog } from "@/lib/i18n/locales/bg";

export interface StopAttachment {
  etaMin: number;
  name: string | null;
  brand: string | null;
  coords: GeoPoint | null;
  detourKm: number | null;
  motorwayService: boolean;
  source: PlanStop["place_source"];
  placeId: string | null;
  price: PlanPrice | null;
  advice: FuelAdvice | null;
  flags: PlaceFlagSummary[];
  lodgingNote: string | null;
  stars: number | null;
  optional?: boolean;
  kinds?: PlanStop["kinds"];
  distanceKm?: number;
}

export interface AssembleInput {
  now: Date;
  departAt: Date;
  vehicle: ResolvedVehicle;
  fromProfile: boolean;
  origin: { label: string; coords: GeoPoint };
  destination: { label: string; coords: GeoPoint };
  distanceKm: number;
  durationMin: number;
  geometry: GeoJSON.LineString;
  routingSource: "valhalla" | "osrm";
  borders: ScoredBorder[];
  borderAlongKm: number | null;
  merged: TimedStop[];
  attachments: StopAttachment[];
  community: CommunityScore;
  warnings: string[];
  preferences: TripPreferences;
  checklist: PlanChecklist;
  weather: RouteWeather;
  why: WhyReason[];
  roadHazards?: RoadHazard[];
  attentionSegments?: Hotspot[];
  sights?: StopAttachment[];
  fuelAverages: FuelCountryAverage[];
  countryAt: (lng: number, lat: number) => string | null;
  averageFor: (country: string) => KnownAverage | null;
  sleepShifts: SleepShift[];
  locale?: Locale;
}

type PlannerCopy = MessageCatalog["planner"];

export function assembleTripPlan(input: AssembleInput): TripPlannerResult {
  const p = catalog(input.locale ?? "bg").planner;
  const chosen = input.borders.find((border) => border.chosen) ?? null;
  const waitMin = chosen?.wait.minutes ?? 0;
  const stops = [
    ...input.merged.map((stop, index) =>
      toPlanStop(stop, index, input, waitMin, p)
    ),
    ...(input.sights ?? []).map((sight, index) =>
      sightStop(sight, input.merged.length + index, input, waitMin, p)
    ),
  ];
  const recommended = bestFuelAdvice(stops);
  const handoff = buildMapsHandoff(exportStops(input, stops));
  const firstLeg = handoff.legs[0];
  const totalMin =
    input.durationMin +
    waitMin +
    (chosen?.communityPenaltyMin ?? input.community.penaltyMin);
  const borderAlongKm = input.borderAlongKm;
  const arriveIso = wallClockEta({
    departAt: input.departAt,
    drivingMin: input.durationMin,
    extraWaitMin:
      borderAlongKm != null ? waitMin : 0,
    sleepShifts: input.sleepShifts,
  }).toISOString();

  const warnings = [...input.warnings];
  if (stops.some((stop) => stop.kinds.includes("overnight"))) {
    warnings.push(p.warnings.hotelRatings);
  }
  if (input.durationMin > 630) {
    warnings.push(p.warnings.confirmOvernight);
  }

  return {
    generated_at: input.now.toISOString(),
    planner: "deterministic",
    depart_at: input.departAt.toISOString(),
    vehicle: {
      vehicle_type: input.vehicle.vehicle_type,
      fuel_type: input.vehicle.fuel_type,
      energy: input.vehicle.energy,
      capacity: input.vehicle.capacity,
      consumption_per_100: input.vehicle.consumption_per_100,
      level: input.vehicle.level,
      reserve: input.vehicle.reserve,
      from_profile: input.fromProfile,
    },
    route: {
      distance_km: Math.round(input.distanceKm),
      duration_min: input.durationMin,
      total_min: totalMin,
      arrive_at: arriveIso,
      routing_source: input.routingSource,
      origin: {
        label: input.origin.label,
        lng: input.origin.coords.lng,
        lat: input.origin.coords.lat,
      },
      destination: {
        label: input.destination.label,
        lng: input.destination.coords.lng,
        lat: input.destination.coords.lat,
      },
      geometry: input.geometry,
      border_waypoint: chosen
        ? {
            label: chosen.nameBg,
            lng: chosen.coords.lng,
            lat: chosen.coords.lat,
          }
        : null,
    },
    border: {
      chosen: chosen ? toChoice(chosen) : null,
      alternatives: input.borders.map(toChoice),
      note: borderNote(input.borders, p.border, input.locale ?? "bg"),
    },
    stops,
    fuel_averages: input.fuelAverages,
    community: {
      penalty_min: input.community.penaltyMin,
      notes: input.community.notes,
    },
    tolls: getRouteTolls({
      geometry: input.geometry,
      origin: { coords: input.origin.coords },
      destination: { coords: input.destination.coords },
    }),
    export: {
      google_url: firstLeg?.googleUrl ?? null,
      apple_url: firstLeg?.appleUrl ?? null,
      waze_url: firstLeg?.wazeUrl ?? null,
      leg_count: handoff.legs.length,
    },
    warnings,
    preferences: input.preferences,
    attribution: OSM_ATTRIBUTION,
    checklist: input.checklist,
    weather: normalizeWeatherSummaries(input.weather, p.weather.hourlyEmpty),
    why_this_route: input.why,
    road_hazards: input.roadHazards ?? [],
    road_hazard_attribution:
      (input.roadHazards?.length ?? 0) > 0 ? DATEX_ATTRIBUTION : null,
    attention_segments: input.attentionSegments ?? [],
    attention_attribution: hotspotAttribution(input.attentionSegments ?? []),
    recommended_fuel: recommended,
  };
}

function toChoice(border: ScoredBorder) {
  return {
    border_id: border.borderId,
    name_bg: border.nameBg,
    name_en: border.nameEn,
    coords: border.coords,
    ppid: border.ppid,
    drive_min: border.driveMin,
    distance_km: border.distanceKm,
    community_penalty_min: border.communityPenaltyMin,
    total_min: border.totalMin,
    chosen: border.chosen,
    reason_code: border.reasonCode,
    reason: border.reason,
    wait: border.wait,
  };
}

function geometryKmAt(input: AssembleInput, roadKm: number): number {
  const length = lineLengthKm(
    input.geometry.coordinates as Array<[number, number]>
  );
  if (input.distanceKm <= 0) return 0;
  return (roadKm / input.distanceKm) * length;
}

function borderNote(
  borders: ScoredBorder[],
  copy: PlannerCopy["border"],
  locale: Locale
): string {
  if (borders.length === 0) {
    return copy.noBgBorder;
  }
  const extra = borders.find(
    (border) => border.reasonCode === "serbia_hungary"
  );
  const compared = borders.filter(
    (border) => border.reasonCode !== "serbia_hungary"
  );
  if (
    compared.length > 0 &&
    compared.every((border) => isHungarySerbiaPlannerId(border.borderId))
  ) {
    return copy.serbiaHungary;
  }
  const base = copy.bgCompared;
  if (!extra) return base;
  return `${base} ${formatTemplate(copy.viaAfter, {
    name: borderDisplayName(locale, {
      id: extra.borderId,
      name_bg: extra.nameBg,
      name_en: extra.nameEn,
    }),
  })}`;
}

function toPlanStop(
  stop: TimedStop,
  index: number,
  input: AssembleInput,
  borderWaitMin: number,
  p: PlannerCopy
): PlanStop {
  const attachment = input.attachments.find(
    (item) => Math.abs(item.etaMin - stop.etaMin) < 0.5
  );
  const fallback = pointAtDistance(
    input.geometry.coordinates as Array<[number, number]>,
    geometryKmAt(input, stop.distanceKm)
  );
  const coords = attachment?.coords ?? fallback;
  const afterBorder =
    input.borderAlongKm != null && stop.distanceKm >= input.borderAlongKm - 1;
  const wait = afterBorder ? borderWaitMin : 0;
  const eta = wallClockEta({
    departAt: input.departAt,
    drivingMin: stop.etaMin,
    extraWaitMin: wait,
    sleepShifts: input.sleepShifts,
  }).toISOString();
  const overnight = stop.kinds.includes("overnight");
  const sleepShift = input.sleepShifts.find(
    (shift) => Math.abs(shift.afterDrivingMin - stop.etaMin) < 0.5
  );
  const sleepMin =
    overnight && sleepShift && sleepShift.sleepMin > 0
      ? sleepShift.sleepMin
      : null;
  const wakeZone =
    overnight && sleepMin
      ? timeZoneForCountry(input.countryAt(coords.lng, coords.lat))
      : null;
  const energy = stop.kinds.includes("charge")
    ? "charge"
    : stop.kinds.includes("fuel")
      ? "fuel"
      : null;

  return {
    id: `stop-${index + 1}`,
    kinds: stop.kinds,
    title: titleFor(stop.kinds, attachment?.name ?? null, p.stops),
    reason: reasonFor(
      stop.kinds,
      attachment,
      stop.etaMin,
      input.durationMin,
      sleepMin,
      eta,
      wakeZone,
      p.stops,
      input.locale ?? "bg"
    ),
    coords,
    distance_from_start_km: Math.round(stop.distanceKm),
    driving_min: Math.round(stop.etaMin),
    eta,
    detour_km: attachment?.detourKm ?? null,
    brand: attachment?.brand ?? null,
    place_name: attachment?.name ?? null,
    on_motorway_service: attachment?.motorwayService ?? false,
    place_id: attachment?.placeId ?? null,
    place_source: attachment?.source ?? "calculated",
    price: attachment?.price ?? null,
    advice: attachment?.advice ?? null,
    ...fuelCopy(stop.kinds, coords, attachment, input),
    flags: attachment?.flags ?? [],
    optional: false,
    price_note: energy && !attachment?.price ? "price unknown" : null,
    ratings_available: overnight ? false : null,
    lodging_note:
      attachment?.lodgingNote ??
      (overnight ? p.warnings.hotelRatingsOvernight : null),
    stars: attachment?.stars ?? null,
    sleep_min: sleepMin,
    wake_time_zone: wakeZone,
  };
}

function sightStop(
  sight: StopAttachment,
  index: number,
  input: AssembleInput,
  borderWaitMin: number,
  p: PlannerCopy
): PlanStop {
  const eta = wallClockEta({
    departAt: input.departAt,
    drivingMin: sight.etaMin,
    extraWaitMin:
      input.borderAlongKm != null &&
      (sight.distanceKm ?? 0) >= input.borderAlongKm - 1
        ? borderWaitMin
        : 0,
    sleepShifts: input.sleepShifts,
  }).toISOString();
  return {
    id: `stop-${index + 1}`,
    kinds: ["sight"],
    title: sight.name ?? p.stops.sight,
    reason: p.stops.sightReason,
    coords: sight.coords ?? input.origin.coords,
    distance_from_start_km: Math.round(sight.distanceKm ?? 0),
    driving_min: Math.round(sight.etaMin),
    eta,
    detour_km: sight.detourKm,
    brand: sight.brand,
    place_name: sight.name,
    on_motorway_service: false,
    place_id: sight.placeId,
    place_source: sight.source,
    price: null,
    advice: null,
    price_band: null,
    average_label_bg: null,
    price_label_bg: null,
    price_delta_label_bg: null,
    price_source_label_bg: null,
    flags: sight.flags,
    optional: true,
    price_note: null,
    ratings_available: null,
    lodging_note: null,
    stars: sight.stars,
  };
}

function fuelCopy(
  kinds: TimedStop["kinds"],
  coords: GeoPoint,
  attachment: StopAttachment | undefined,
  input: AssembleInput
): Pick<
  PlanStop,
  | "price_band"
  | "average_label_bg"
  | "price_label_bg"
  | "price_delta_label_bg"
  | "price_source_label_bg"
> {
  const blank = {
    price_band: null,
    average_label_bg: null,
    price_label_bg: null,
    price_delta_label_bg: null,
    price_source_label_bg: null,
  };
  const fuel = input.vehicle.fuel_type;
  if (!kinds.includes("fuel") || fuel === "electric") return blank;
  const country = input.countryAt(coords.lng, coords.lat);
  return presentFuelStop({
    countryCode: country,
    fuel,
    average: country ? input.averageFor(country) : null,
    stationPerL: attachment?.price?.amount ?? null,
    source: attachment?.price?.source ?? null,
    observedAt: attachment?.price?.observed_at ?? null,
    liters: fillLiters(input.vehicle),
    now: input.now,
  });
}

function bestFuelAdvice(
  stops: PlanStop[]
): TripPlannerResult["recommended_fuel"] {
  let best: TripPlannerResult["recommended_fuel"] = null;
  for (const stop of stops) {
    if (!stop.advice) continue;
    if (!best || stop.advice.est_savings_eur > best.advice.est_savings_eur) {
      best = { stop_id: stop.id, advice: stop.advice };
    }
  }
  return best;
}

function titleFor(
  kinds: TimedStop["kinds"],
  name: string | null,
  stops: PlannerCopy["stops"]
): string {
  if (kinds.includes("overnight") && kinds.includes("fuel"))
    return name ?? stops.chargeOvernight;
  if (kinds.includes("overnight") && kinds.includes("charge"))
    return name ?? stops.chargeOvernight;
  if (kinds.includes("overnight")) return name ?? stops.overnight;
  if (kinds.includes("charge") && kinds.includes("rest"))
    return name ?? stops.chargeRest;
  if (kinds.includes("fuel") && kinds.includes("rest"))
    return name ?? stops.fuelRest;
  if (kinds.includes("charge")) return name ?? stops.charge;
  if (kinds.includes("fuel")) return name ?? stops.fuel;
  return stops.rest;
}

function reasonFor(
  kinds: TimedStop["kinds"],
  attachment: StopAttachment | undefined,
  drivingMin: number,
  totalDriveMin: number,
  sleepMin: number | null,
  arrivalIso: string,
  wakeTimeZone: string | null,
  stops: PlannerCopy["stops"],
  locale: Locale
): string {
  const parts: string[] = [];
  if (kinds.includes("fuel") || kinds.includes("charge")) {
    parts.push(stops.reserveLow);
    if (attachment?.motorwayService) {
      parts.push(stops.motorwayService);
    } else if (attachment?.name) {
      parts.push(stops.detourFuel);
    }
  }
  if (
    kinds.includes("rest") &&
    (kinds.includes("fuel") || kinds.includes("charge"))
  ) {
    parts.push(stops.restWithCharge);
  } else if (kinds.includes("rest")) {
    parts.push(stops.restAfterDrive);
  }
  if (kinds.includes("overnight") && sleepMin != null && sleepMin > 0) {
    const zone = wakeTimeZone ?? "Europe/Sofia";
    const wake = wakeAt(new Date(arrivalIso), zone);
    const wakeLabel = formatWakeLabel(wake, zone);
    const place = timeZoneLabel(zone, locale);
    const remaining = Math.max(0, totalDriveMin - drivingMin);
    parts.push(
      formatTemplate(stops.overnightWake, {
        wake: wakeLabel,
        place,
        remaining: formatClockDuration(remaining, unitsFrom(catalog(locale))),
      })
    );
  } else if (kinds.includes("overnight")) {
    parts.push(stops.overnightGeneric);
  }
  if (attachment?.lodgingNote) parts.push(attachment.lodgingNote);
  return parts.join(" ");
}

function exportStops(input: AssembleInput, stops: PlanStop[]): MapStop[] {
  return [
    {
      lat: input.origin.coords.lat,
      lng: input.origin.coords.lng,
      label: input.origin.label,
    },
    ...stops.map((stop) => ({
      lat: stop.coords.lat,
      lng: stop.coords.lng,
      label: stop.title,
    })),
    {
      lat: input.destination.coords.lat,
      lng: input.destination.coords.lng,
      label: input.destination.label,
    },
  ];
}

function normalizeWeatherSummaries(
  weather: RouteWeather,
  hourlyEmpty: string
): RouteWeather {
  return {
    ...weather,
    segments: weather.segments.map((segment) =>
      segment.summary_bg === hourlyEmpty
        ? { ...segment, summary_bg: "" }
        : segment
    ),
  };
}
