import { describe, expect, it } from "vitest";
import { summarizeLedger } from "@/lib/costs/ledger";

describe("trip balance", () => {
  const log = {
    odometer_start_km: 120_000,
    odometer_end_km: 123_400,
    expenses: [
      { id: "a", category: "fuel", amount_eur: 180 },
      { id: "b", category: "fuel", amount_eur: 170.5 },
      { id: "c", category: "vignette", amount_eur: 30 },
      { id: "d", category: "meals", amount_eur: 95 },
    ],
    estimate: {
      total_eur: 400,
      total_low: 350,
      total_high: 480,
      lines: [
        { id: "fuel", country: null, eur: 300 },
        { id: "vignette", country: "BG", eur: 20 },
        { id: "vignette", country: "RO", eur: 6 },
        { id: "bridge", country: null, eur: null },
      ],
    },
  };

  it("adds the expenses by category and against the estimate", () => {
    const summary = summarizeLedger(log);
    expect(summary.spent).toBe(475.5);
    expect(summary.byCategory).toEqual({ fuel: 350.5, vignette: 30, meals: 95 });
    expect(summary.estimateByCategory).toEqual({ fuel: 300, vignette: 26 });
    expect(summary.difference).toBe(75.5);
  });

  it("works out the kilometres and what the fuel cost per 100", () => {
    const summary = summarizeLedger(log);
    expect(summary.drivenKm).toBe(3400);
    expect(summary.fuelPer100).toBeCloseTo(10.31, 2);
  });

  it("says nothing it cannot know", () => {
    const empty = summarizeLedger(null);
    expect(empty).toMatchObject({ spent: 0, estimateTotal: null, difference: null, drivenKm: null, fuelPer100: null });
    const back = summarizeLedger({ odometer_start_km: 5000, odometer_end_km: 4000 });
    expect(back.drivenKm).toBeNull();
  });
});
