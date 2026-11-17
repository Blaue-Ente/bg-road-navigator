import { distanceToPolylineKm, lineLengthKm } from "@/lib/planner/line";
import type { PlanStop, TripPlannerResult } from "@/lib/planner/types";

export interface TripPosition {
  lng: number;
  lat: number;
}

export interface TripProgress {
  /** Road kilometres driven so far; 0 until the position is known. */
  alongKm: number;
  /** How far the position is from the planned line; null without a position. */
  offRouteKm: number | null;
  remainingKm: number;
  next: { stop: PlanStop; distanceKm: number; etaMs: number } | null;
  arriveMs: number;
}

/** Further from the line than this and the driver has left the route. */
export const OFF_ROUTE_KM = 1.5;
/** A stop this close behind the position counts as reached. */
const REACHED_KM = 0.4;

/**
 * Where the driver is on the plan, which stop is next, and when the stop and
 * the destination are reached at the planned average speed. Without a
 * position it describes the plan from the start.
 */
export function tripProgress(input: {
  plan: TripPlannerResult;
  position: TripPosition | null;
  nowMs: number;
}): TripProgress {
  const { plan, position, nowMs } = input;
  const totalKm = Math.max(1, plan.route.distance_km);
  const line = plan.route.geometry.coordinates.map(
    (point) => [point[0]!, point[1]!] as [number, number]
  );
  const geometryKm = lineLengthKm(line);
  const scale = geometryKm > 0 ? totalKm / geometryKm : 1;

  let alongKm = 0;
  let offRouteKm: number | null = null;
  if (position && line.length >= 2) {
    const nearest = distanceToPolylineKm(line, position);
    alongKm = Math.min(totalKm, nearest.alongKm * scale);
    offRouteKm = nearest.distanceKm;
  }

  const speedKmh = Math.max(
    20,
    totalKm / Math.max(1, plan.route.duration_min / 60)
  );
  const remainingKm = Math.max(0, totalKm - alongKm);

  const upcoming = plan.stops
    .filter((stop) => !stop.optional && !stop.kinds.includes("sight"))
    .filter((stop) => stop.distance_from_start_km > alongKm + REACHED_KM)
    .sort((a, b) => a.distance_from_start_km - b.distance_from_start_km)[0];

  const next = upcoming
    ? (() => {
        const distanceKm = upcoming.distance_from_start_km - alongKm;
        return {
          stop: upcoming,
          distanceKm,
          etaMs: nowMs + (distanceKm / speedKmh) * 3_600_000,
        };
      })()
    : null;

  const plannedArrival = Date.parse(plan.route.arrive_at ?? "");
  const arriveMs = position
    ? nowMs + (remainingKm / speedKmh) * 3_600_000
    : Number.isFinite(plannedArrival)
      ? plannedArrival
      : nowMs + (remainingKm / speedKmh) * 3_600_000;

  return { alongKm, offRouteKm, remainingKm, next, arriveMs };
}
