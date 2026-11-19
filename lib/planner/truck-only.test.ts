import { describe, expect, it } from "vitest";
import { isTruckOnlyStation } from "@/lib/planner/pick-place";

describe("truck-only stations", () => {
  it("skips fuel-card lorry depots but keeps ordinary stations", () => {
    expect(isTruckOnlyStation({ name: "EW", brand: "Eurowag" })).toBe(true);
    expect(isTruckOnlyStation({ name: "Truck Stop Nord" })).toBe(true);
    expect(isTruckOnlyStation({ name: "Tesco", brand: "Tesco Express" })).toBe(false);
    expect(isTruckOnlyStation({ name: "OMV" })).toBe(false);
  });
});
