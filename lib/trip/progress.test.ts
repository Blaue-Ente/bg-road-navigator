import { describe, expect, it } from "vitest";
import { OFF_ROUTE_KM, tripProgress } from "@/lib/trip/progress";
import type { PlanStop, TripPlannerResult } from "@/lib/planner/types";

// A straight line along the equator: one degree of longitude is about 111.2 km.
const coordinates = Array.from({ length: 11 }, (_, i) => [i * 0.1, 0]);

function stop(id: string, km: number, extra: Partial<PlanStop> = {}): PlanStop {
  return {
    id,
    kinds: ["fuel"],
    title: id,
    distance_from_start_km: km,
    optional: false,
    coords: { lng: km / 111.2, lat: 0 },
    ...extra,
  } as PlanStop;
}

const plan = {
  route: {
    distance_km: 111,
    duration_min: 111,
    arrive_at: "2026-11-17T20:00:00.000Z",
    geometry: { type: "LineString", coordinates },
  },
  stops: [
    stop("a", 30),
    stop("sight", 40, { optional: true, kinds: ["sight"] }),
    stop("b", 80, { kinds: ["overnight"] }),
  ],
} as unknown as TripPlannerResult;

const NOW = Date.parse("2026-11-17T08:00:00.000Z");

describe("tripProgress", () => {
  it("describes the plan from the start without a position", () => {
    const progress = tripProgress({ plan, position: null, nowMs: NOW });
    expect(progress.alongKm).toBe(0);
    expect(progress.offRouteKm).toBeNull();
    expect(progress.next?.stop.id).toBe("a");
    expect(progress.next?.distanceKm).toBe(30);
    expect(progress.arriveMs).toBe(Date.parse("2026-11-17T20:00:00.000Z"));
  });

  it("finds the next stop and the time to reach it", () => {
    const progress = tripProgress({
      plan,
      position: { lng: 0.4, lat: 0 }, // about 44 km along
      nowMs: NOW,
    });
    expect(progress.next?.stop.id).toBe("b");
    expect(progress.next?.distanceKm).toBeGreaterThan(35);
    expect(progress.next?.distanceKm).toBeLessThan(37);
    // 60 km/h, so 36 km take about 36 minutes.
    const minutes = ((progress.next?.etaMs ?? 0) - NOW) / 60_000;
    expect(minutes).toBeGreaterThan(34);
    expect(minutes).toBeLessThan(38);
    expect(progress.remainingKm).toBeGreaterThan(66);
  });

  it("skips optional sights", () => {
    const progress = tripProgress({
      plan,
      position: { lng: 0.3, lat: 0 }, // past stop "a", before the sight
      nowMs: NOW,
    });
    expect(progress.next?.stop.id).toBe("b");
  });

  it("has no next stop after the last one", () => {
    const progress = tripProgress({
      plan,
      position: { lng: 0.95, lat: 0 },
      nowMs: NOW,
    });
    expect(progress.next).toBeNull();
    expect(progress.remainingKm).toBeLessThan(10);
  });

  it("reports how far off the route the position is", () => {
    const progress = tripProgress({
      plan,
      position: { lng: 0.5, lat: 0.1 }, // about 11 km north of the line
      nowMs: NOW,
    });
    expect(progress.offRouteKm).toBeGreaterThan(OFF_ROUTE_KM);
  });
});
