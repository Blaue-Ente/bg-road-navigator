import type { TripGuideInput } from "@/lib/ai/trip-guide";
import type { Locale } from "@/lib/i18n/locale";
import type { PlanStop, TripPlannerResult } from "@/lib/planner/types";

/** "19 Dec, 13:00" in the device's own clock, which is what the driver sees on the plan. */
function clock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 40);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function stopFacts(stop: PlanStop): string[] {
  const facts: string[] = [];
  if (stop.reason) facts.push(stop.reason.slice(0, 120));
  if (stop.brand) facts.push(`brand ${stop.brand}`.slice(0, 120));
  if (stop.price_label_bg) facts.push(stop.price_label_bg.slice(0, 120));
  if (stop.price_delta_label_bg) facts.push(stop.price_delta_label_bg.slice(0, 120));
  for (const flag of stop.flags.slice(0, 3)) {
    facts.push(`drivers flagged: ${flag.flag}`);
  }
  if (stop.stars != null) facts.push(`${stop.stars} stars on OpenStreetMap`);
  return facts.slice(0, 6);
}

/** The plan's facts for the model, in a small, bounded shape. */
export function guideInputFromPlan(
  plan: TripPlannerResult,
  locale: Locale,
  countries: string[] = []
): TripGuideInput {
  const prefs = plan.preferences;
  return {
    locale,
    origin: plan.route.origin.label.slice(0, 120),
    destination: plan.route.destination.label.slice(0, 120),
    distance_km: plan.route.distance_km,
    duration_min: plan.route.duration_min,
    travelers: {
      adults: Math.min(8, Math.max(1, prefs.drivers, prefs.with_children ? 2 : 1)),
      children_ages: prefs.with_children ? prefs.children_ages.slice(0, 8) : [],
      pet: prefs.with_pet,
      drivers: prefs.drivers,
    },
    vehicle: plan.vehicle.vehicle_type,
    countries: countries.slice(0, 12),
    stops: plan.stops
      .filter((stop) => !stop.optional && !stop.kinds.includes("sight"))
      .slice(0, 24)
      .map((stop) => ({
        id: stop.id.slice(0, 60),
        kind: stop.kinds.join("+").slice(0, 60),
        title: stop.title.slice(0, 120),
        place: (stop.place_name ?? null)?.slice(0, 120) ?? null,
        km: stop.distance_from_start_km,
        local_time: clock(stop.eta),
        detour_km: stop.detour_km,
        facts: stopFacts(stop),
      })),
    food_spots: (plan.food_spots ?? []).slice(0, 12).map((spot) => ({
      chain: spot.chain.slice(0, 40),
      km: spot.distance_from_start_km,
      local_time: clock(spot.eta),
      detour_km: Math.min(50, spot.detour_km),
    })),
  };
}
