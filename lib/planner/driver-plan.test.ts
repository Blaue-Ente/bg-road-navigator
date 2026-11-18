import { describe, expect, it } from "vitest";
import { buildDriverPlan } from "@/lib/planner/driver-plan";
import type { PlanStop } from "@/lib/planner/types";

const stop = (id: string, drivingMin: number, extra: Partial<PlanStop> = {}) =>
  ({
    id,
    title: id,
    kinds: ["rest"],
    optional: false,
    driving_min: drivingMin,
    distance_from_start_km: drivingMin,
    eta: new Date(Date.UTC(2026, 11, 18, 21, 0) + drivingMin * 60_000).toISOString(),
    ...extra,
  }) as PlanStop;

const base = {
  startLabel: "Berlin",
  startEta: "2026-12-18T21:00:00.000Z",
  endLabel: "Sofia",
  endEta: "2026-12-19T21:00:00.000Z",
  totalKm: 900,
  totalDrivingMin: 900,
};

describe("driver plan", () => {
  it("is absent for a single driver", () => {
    expect(buildDriverPlan({ ...base, drivers: 1, stops: [] })).toBeNull();
  });

  it("swaps at the first stop after a full turn, round robin", () => {
    const plan = buildDriverPlan({
      ...base,
      drivers: 2,
      stops: [stop("a", 100), stop("b", 160), stop("c", 320), stop("d", 480)],
    })!;
    // Turns end at b (160 >= 150), then at d (480 - 160 = 320; c is 160 after b).
    expect(plan.turns.map((turn) => [turn.driver, turn.until_label])).toEqual([
      [1, "b"],
      [2, "c"],
      [1, "d"],
      [2, "Sofia"],
    ]);
    expect(plan.per_driver_min[0]! + plan.per_driver_min[1]!).toBe(900);
  });

  it("swaps early when the next stop is too far to keep a turn short", () => {
    const plan = buildDriverPlan({
      ...base,
      drivers: 2,
      stops: [stop("a", 100), stop("b", 300)],
    })!;
    // At a (100 min) the next stop is 200 min on: 300 > 150 + 30, so swap at a.
    expect(plan.turns[0]!.until_label).toBe("a");
  });

  it("hands the wheel on after a night's sleep", () => {
    const plan = buildDriverPlan({
      ...base,
      drivers: 3,
      stops: [stop("n", 100, { kinds: ["overnight"], sleep_min: 480 })],
    })!;
    expect(plan.turns[0]!.driver).toBe(1);
    expect(plan.turns[1]!.driver).toBe(2);
  });
});
