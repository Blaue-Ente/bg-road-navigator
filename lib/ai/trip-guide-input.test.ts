import { describe, expect, it } from "vitest";
import { alongPoints, leavesAtNight, stopFacts } from "@/lib/ai/trip-guide-input";
import type { PlanStop } from "@/lib/planner/types";

describe("trip guide input helpers", () => {
  it("spreads towns along a long road and none on a short hop", () => {
    const line: Array<[number, number]> = Array.from({ length: 101 }, (_, i) => [10 + i * 0.1, 50]);
    const points = alongPoints(line, 1000, 6);
    expect(points).toHaveLength(6);
    expect(points[0]!.km).toBeLessThan(points[5]!.km);
    expect(alongPoints(line, 100)).toEqual([]);
  });

  it("knows an evening or night start", () => {
    expect(leavesAtNight(new Date(2026, 11, 18, 21, 0).toISOString())).toBe(true);
    expect(leavesAtNight(new Date(2026, 11, 18, 3, 0).toISOString())).toBe(true);
    expect(leavesAtNight(new Date(2026, 11, 18, 8, 0).toISOString())).toBe(false);
  });

  it("keeps a Nakordoni price out of the facts sent to the model", () => {
    const base = {
      reason: "fuel",
      brand: null,
      flags: [],
      price_label_bg: "1.52 EUR/l",
      average_label_bg: null,
      price_delta_label_bg: "cheap",
    } as unknown as PlanStop;
    const own = stopFacts({ ...base, price_source_label_bg: "E-Control" } as PlanStop);
    expect(own.join(" ")).toContain("1.52");
    const theirs = stopFacts({ ...base, price_source_label_bg: "Nakordoni" } as PlanStop);
    expect(theirs.join(" ")).not.toContain("1.52");
    expect(theirs.join(" ")).not.toContain("cheap");
  });
});
