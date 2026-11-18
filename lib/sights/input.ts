import type { SightsInput } from "@/lib/ai/sights";
import { alongPoints } from "@/lib/ai/trip-guide-input";
import type { Locale } from "@/lib/i18n/locale";
import type { TripPlannerResult } from "@/lib/planner/types";

const MAX_LINE_POINTS = 380;

/** Which plan a list of places belongs to. */
export function sightsKey(plan: TripPlannerResult, via: string[]): string {
  return [
    plan.route.origin.label,
    plan.route.destination.label,
    Math.round(plan.route.distance_km),
    via.join("+"),
  ].join("|");
}

export function sightsInputFromPlan(
  plan: TripPlannerResult,
  locale: Locale,
  via: string[]
): SightsInput {
  const coordinates = plan.route.geometry.coordinates as Array<[number, number]>;
  const step = Math.max(1, Math.ceil(coordinates.length / MAX_LINE_POINTS));
  const line = coordinates
    .filter((_, index) => index % step === 0 || index === coordinates.length - 1)
    .map(([lng, lat]) => [Math.round(lng * 1e4) / 1e4, Math.round(lat * 1e4) / 1e4] as [number, number]);
  const prefs = plan.preferences;
  return {
    locale,
    origin: plan.route.origin.label.slice(0, 120),
    destination: plan.route.destination.label.slice(0, 120),
    distance_km: plan.route.distance_km,
    via: via.slice(0, 3).map((label) => label.slice(0, 120)),
    children_ages: prefs.with_children ? prefs.children_ages.slice(0, 8) : [],
    pet: prefs.with_pet,
    along: alongPoints(coordinates, plan.route.distance_km, 8),
    rest_km: plan.stops
      .filter((stop) => !stop.optional && !stop.kinds.includes("sight") && !stop.kinds.includes("overnight"))
      .map((stop) => stop.distance_from_start_km)
      .slice(0, 24),
    line,
  };
}

/** Extra minutes the chosen places add to the trip. */
export function chosenExtraMin(
  items: Array<{ id: string; extra_min: number }>,
  chosen: string[]
): number {
  return items
    .filter((item) => chosen.includes(item.id))
    .reduce((sum, item) => sum + item.extra_min, 0);
}
