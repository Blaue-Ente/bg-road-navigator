import { getRouteTolls } from "@/lib/utils/route-tolls";
import { buildMapsHandoff, type MapStop } from "@/lib/utils/maps-handoff";
import type { TimedStop } from "@/lib/planner/breaks";
import { lineLengthKm, pointAtDistance } from "@/lib/planner/line";
import type { CommunityScore } from "@/lib/planner/community";
import type { ScoredBorder } from "@/lib/planner/borders";
import type {
  PlanPrice,
  PlanStop,
  TripPlannerResult,
} from "@/lib/planner/types";
import type { ResolvedVehicle } from "@/lib/planner/vehicle";
import type { GeoPoint } from "@/types/route.types";

export interface StopAttachment {
  etaMin: number;
  name: string | null;
  brand: string | null;
  coords: GeoPoint | null;
  detourKm: number | null;
  motorwayService: boolean;
  source: PlanStop["place_source"];
  price: PlanPrice | null;
  lodgingNote: string | null;
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
}

export function assembleTripPlan(input: AssembleInput): TripPlannerResult {
  const chosen = input.borders.find((border) => border.chosen) ?? null;
  const waitMin = chosen?.wait.minutes ?? 0;
  const stops = input.merged.map((stop, index) =>
    toPlanStop(stop, index, input, waitMin)
  );
  const handoff = buildMapsHandoff(exportStops(input, stops));
  const firstLeg = handoff.legs[0];
  const totalMin =
    input.durationMin +
    waitMin +
    (chosen?.communityPenaltyMin ?? input.community.penaltyMin);

  const warnings = [...input.warnings];
  if (stops.some((stop) => stop.kinds.includes("overnight"))) {
    warnings.push("Оценки на местата за нощувка още не са налични.");
  }
  if (input.durationMin > 630) {
    warnings.push(
      "Пътуването е над 10 часа шофиране. Потвърдете нощувката преди тръгване."
    );
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
      note: borderNote(input.borders),
    },
    stops,
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

function borderNote(borders: ScoredBorder[]): string {
  if (borders.length === 0) {
    return "Няма български граничен пункт между тези две точки. Маршрутът е директният.";
  }
  return "Сравнени са българските пунктове по направлението. Чакането е оценка, не официално време.";
}

function toPlanStop(
  stop: TimedStop,
  index: number,
  input: AssembleInput,
  borderWaitMin: number
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
  const clockMin = stop.etaMin + (afterBorder ? borderWaitMin : 0);
  const eta = new Date(
    input.departAt.getTime() + clockMin * 60_000
  ).toISOString();
  const overnight = stop.kinds.includes("overnight");
  const energy = stop.kinds.includes("charge")
    ? "charge"
    : stop.kinds.includes("fuel")
      ? "fuel"
      : null;

  return {
    id: `stop-${index + 1}`,
    kinds: stop.kinds,
    title: titleFor(stop.kinds, attachment?.name ?? null),
    reason: reasonFor(stop.kinds, attachment),
    coords,
    distance_from_start_km: Math.round(stop.distanceKm),
    driving_min: Math.round(stop.etaMin),
    eta,
    detour_km: attachment?.detourKm ?? null,
    brand: attachment?.brand ?? null,
    place_name: attachment?.name ?? null,
    on_motorway_service: attachment?.motorwayService ?? false,
    place_source: attachment?.source ?? "calculated",
    price: attachment?.price ?? null,
    price_note: energy && !attachment?.price ? "price unknown" : null,
    ratings_available: overnight ? false : null,
    lodging_note:
      attachment?.lodgingNote ??
      (overnight ? "Оценки на нощувките още не са налични." : null),
  };
}

function titleFor(kinds: TimedStop["kinds"], name: string | null): string {
  if (kinds.includes("overnight") && kinds.includes("fuel"))
    return name ?? "Зареждане и нощувка";
  if (kinds.includes("overnight") && kinds.includes("charge"))
    return name ?? "Зареждане и нощувка";
  if (kinds.includes("overnight")) return name ?? "Нощувка";
  if (kinds.includes("charge") && kinds.includes("rest"))
    return name ?? "Зареждане и почивка";
  if (kinds.includes("fuel") && kinds.includes("rest"))
    return name ?? "Гориво и почивка";
  if (kinds.includes("charge")) return name ?? "Зареждане";
  if (kinds.includes("fuel")) return name ?? "Гориво";
  return "Почивка";
}

function reasonFor(
  kinds: TimedStop["kinds"],
  attachment: StopAttachment | undefined
): string {
  const parts: string[] = [];
  if (kinds.includes("fuel") || kinds.includes("charge")) {
    parts.push("Резервът свършва в този участък.");
    if (attachment?.motorwayService) {
      parts.push("Станцията е в крайпътно обслужване.");
    } else if (attachment?.name) {
      parts.push("Предпочетена е станция до 3 км извън магистралата.");
    }
  }
  if (
    kinds.includes("rest") &&
    (kinds.includes("fuel") || kinds.includes("charge"))
  ) {
    parts.push("Почивката съвпада със зареждането.");
  } else if (kinds.includes("rest")) {
    parts.push("Почивка след около 2–2.5 часа шофиране.");
  }
  if (kinds.includes("overnight")) {
    parts.push("Дълъг етап: прозорец за нощувка. Оценки още няма.");
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
