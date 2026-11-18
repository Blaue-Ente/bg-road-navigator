import type { HistoryInputs, HistorySummary } from "@/lib/db/schema";
import type { TripPlannerResult } from "@/lib/planner/types";

export const HISTORY_KEEP = 30;

export interface HistoryEntryInput {
  plan_key: string;
  name: string;
  inputs: HistoryInputs;
  summary: HistorySummary;
}

/** A stable key for one generated plan, so recording it twice keeps one row. */
export function historyPlanKey(plan: Pick<TripPlannerResult, "generated_at">): string {
  return plan.generated_at.slice(0, 40);
}

/** What the history keeps of a plan: the inputs to run it again and a short summary. */
export function historyEntryFromPlan(input: {
  plan: TripPlannerResult;
  via: Array<{ label: string; lng: number; lat: number }>;
  fuelLevel: number;
}): HistoryEntryInput {
  const { plan } = input;
  const route = plan.route;
  const arrive =
    route.arrive_at ??
    new Date(Date.parse(plan.depart_at) + route.total_min * 60_000).toISOString();
  const real = plan.stops.filter((stop) => !stop.optional && !stop.kinds.includes("sight"));
  return {
    plan_key: historyPlanKey(plan),
    name: `${route.origin.label} → ${route.destination.label}`.slice(0, 120),
    inputs: {
      origin: {
        label: route.origin.label,
        lng: route.origin.lng,
        lat: route.origin.lat,
      },
      destination: {
        label: route.destination.label,
        lng: route.destination.lng,
        lat: route.destination.lat,
      },
      via: input.via.slice(0, 3),
      preferences: plan.preferences,
      depart_at: plan.depart_at,
      return_at: plan.return_at ?? null,
      fuel_level: Math.min(1, Math.max(0.05, input.fuelLevel)),
    },
    summary: {
      distance_km: route.distance_km,
      duration_min: route.duration_min,
      total_min: route.total_min,
      depart_at: plan.depart_at,
      arrive_at: arrive,
      nights: real.filter((stop) => stop.kinds.includes("overnight")).length,
      stops: real.length,
      border: plan.border.chosen?.name_en ?? null,
      cost_total_eur: plan.costs?.total_eur ?? null,
      cost_per_person_eur: plan.costs?.per_person_eur ?? null,
    },
  };
}

/** The difference between two summaries, B minus A. */
export function compareSummaries(a: HistorySummary, b: HistorySummary) {
  const delta = (x: number | null, y: number | null) =>
    x == null || y == null ? null : Math.round((y - x) * 10) / 10;
  return {
    distance_km: delta(a.distance_km, b.distance_km),
    duration_min: delta(a.duration_min, b.duration_min),
    total_min: delta(a.total_min, b.total_min),
    nights: delta(a.nights, b.nights),
    stops: delta(a.stops, b.stops),
    cost_total_eur: delta(a.cost_total_eur, b.cost_total_eur),
    cost_per_person_eur: delta(a.cost_per_person_eur, b.cost_per_person_eur),
  };
}
