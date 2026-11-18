import { describe, expect, it } from "vitest";
import { compareSummaries, historyEntryFromPlan, historyPlanKey } from "@/lib/history/entry";
import { resolveTripPreferences } from "@/lib/planner/preferences";
import type { TripPlannerResult } from "@/lib/planner/types";

function plan(overrides: Record<string, unknown> = {}): TripPlannerResult {
  return {
    generated_at: "2026-12-18T20:00:00.000Z",
    depart_at: "2026-12-18T21:00:00.000Z",
    return_at: null,
    preferences: resolveTripPreferences({ pace: "scenic" }),
    route: {
      origin: { label: "Berlin", lng: 13.4, lat: 52.5 },
      destination: { label: "Sofia", lng: 23.3, lat: 42.7 },
      distance_km: 1800,
      duration_min: 1100,
      total_min: 1500,
    },
    border: { chosen: { name_en: "Kalotina" } },
    costs: { total_eur: 900, per_person_eur: 300 },
    stops: [
      { kinds: ["rest"], optional: false },
      { kinds: ["overnight"], optional: false },
      { kinds: ["sight"], optional: true },
    ],
    ...overrides,
  } as unknown as TripPlannerResult;
}

describe("history entry", () => {
  it("keeps the inputs to run a plan again and a short summary", () => {
    const entry = historyEntryFromPlan({
      plan: plan(),
      via: [{ label: "Cluj", lng: 23.6, lat: 46.8 }],
      fuelLevel: 0.8,
    });
    expect(entry.plan_key).toBe(historyPlanKey(plan()));
    expect(entry.name).toBe("Berlin → Sofia");
    expect(entry.inputs.via).toHaveLength(1);
    expect(entry.inputs.preferences.pace).toBe("scenic");
    expect(entry.summary).toMatchObject({ distance_km: 1800, nights: 1, stops: 2, border: "Kalotina", cost_total_eur: 900 });
  });

  it("works without costs or a chosen border", () => {
    const entry = historyEntryFromPlan({
      plan: plan({ costs: undefined, border: { chosen: null } }),
      via: [],
      fuelLevel: 2,
    });
    expect(entry.summary.cost_total_eur).toBeNull();
    expect(entry.summary.border).toBeNull();
    expect(entry.inputs.fuel_level).toBe(1);
  });

  it("compares two summaries, second against first", () => {
    const a = historyEntryFromPlan({ plan: plan(), via: [], fuelLevel: 0.8 }).summary;
    const b = { ...a, distance_km: 2000, total_min: 1400, cost_total_eur: null };
    const diff = compareSummaries(a, b);
    expect(diff.distance_km).toBe(200);
    expect(diff.total_min).toBe(-100);
    expect(diff.cost_total_eur).toBeNull();
    expect(diff.nights).toBe(0);
  });
});
