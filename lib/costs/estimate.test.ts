import { describe, expect, it } from "vitest";
import { cheapestCovering, estimatePlanCosts, vignetteChoice, type CostInput } from "@/lib/costs/estimate";
import { VIGNETTES } from "@/lib/costs/price-tables";

function input(overrides: Partial<CostInput> = {}): CostInput {
  return {
    distanceKm: 1500,
    driveMin: 900,
    countryKm: { DE: 400, CZ: 300, SK: 100, HU: 200, RO: 100, RS: 150, BG: 250 },
    stops: [
      { kinds: ["rest"], country: "DE" },
      { kinds: ["fuel"], country: "CZ" },
      { kinds: ["overnight"], country: "RO" },
      { kinds: ["rest"], country: "RS" },
    ],
    vehicle: { energy: "fuel", consumption_per_100: 7 },
    averagePerL: { DE: 1.9, CZ: 1.7, SK: 1.7, HU: 1.7, RO: 1.6, RS: 1.7, BG: 1.5 },
    adults: 2,
    childrenAges: [9],
    departAt: new Date("2026-12-19T06:00:00Z"),
    returnAt: null,
    borderId: null,
    ...overrides,
  };
}

describe("vignette choice", () => {
  it("takes the cheapest product that covers the days", () => {
    expect(cheapestCovering(VIGNETTES.AT!, 3).days).toBe(10);
    expect(cheapestCovering(VIGNETTES.BG!, 1).days).toBe(1);
    expect(cheapestCovering(VIGNETTES.BG!, 20).days).toBe(30);
  });

  it("uses the longest product when none is long enough", () => {
    expect(cheapestCovering(VIGNETTES.CH!, 3).days).toBe(365);
    expect(cheapestCovering(VIGNETTES.SI!, 400).days).toBe(365);
  });

  it("buys one short product for each pass when that is cheaper than a long one", () => {
    // Austria, three weeks: a day pass each way (19.20) beats one 2-month vignette (32.00).
    const choice = vignetteChoice({ products: VIGNETTES.AT!, spanDays: 21, passDays: 1, roundTrip: true });
    expect(choice).toMatchObject({ count: 2, days: 1, total: 19.2 });
  });

  it("keeps one product when it is cheaper than two", () => {
    // Slovenia has no day pass: a week each way (32) loses to one month (32 is not less), so one month stays.
    const choice = vignetteChoice({ products: VIGNETTES.SI!, spanDays: 20, passDays: 1, roundTrip: true });
    expect(choice).toMatchObject({ count: 1, days: 30, total: 32 });
  });
});

describe("trip cost estimate", () => {
  it("adds fuel from the distance, the consumption and each country's pump price", () => {
    const costs = estimatePlanCosts(input());
    const fuel = costs.lines.find((line) => line.id === "fuel")!;
    // 1500 km at 7 l/100 km = 105 litres.
    expect(fuel.detail.liters).toBe(105);
    expect(fuel.eur).toBeGreaterThan(165);
    expect(fuel.eur).toBeLessThan(195);
  });

  it("counts a vignette for each country that has one, and a toll for distance-toll countries", () => {
    const costs = estimatePlanCosts(input());
    const vignettes = costs.lines.filter((line) => line.id === "vignette").map((line) => line.country);
    expect(vignettes.sort()).toEqual(["BG", "CZ", "HU", "RO", "SK"]);
    expect(costs.lines.some((line) => line.id === "tolls" && line.country === "RS")).toBe(true);
    // Germany needs neither.
    expect(costs.lines.some((line) => line.country === "DE")).toBe(false);
  });

  it("counts only the tolled part of Poland and reports those kilometres", () => {
    const costs = estimatePlanCosts(input({ countryKm: { DE: 100, PL: 550, SK: 150 } }));
    const pl = costs.lines.find((line) => line.id === "tolls" && line.country === "PL")!;
    // 550 km, 30% of it tolled, at 0.06 EUR/km.
    expect(pl.detail.km).toBe(165);
    expect(pl.eur).toBeCloseTo(9.9, 1);
  });

  it("doubles the road costs for a round trip and chooses vignettes for the whole stay", () => {
    const oneWay = estimatePlanCosts(input());
    const back = estimatePlanCosts(input({ returnAt: new Date("2027-01-03T06:00:00Z") }));
    const fuelOne = oneWay.lines.find((line) => line.id === "fuel")!.eur!;
    const fuelBack = back.lines.find((line) => line.id === "fuel")!.eur!;
    expect(fuelBack).toBeCloseTo(fuelOne * 2, -1);
    expect(back.round_trip).toBe(true);
    expect(back.trip_days).toBe(16);
    expect(back.total_eur).toBeGreaterThan(oneWay.total_eur);
  });

  it("charges nights by rooms for the adults, and children eat less", () => {
    const family = estimatePlanCosts(input({ adults: 2, childrenAges: [9] }));
    const six = estimatePlanCosts(input({ adults: 4, childrenAges: [] }));
    expect(family.lines.find((line) => line.id === "lodging")!.detail.rooms).toBe(1);
    expect(six.lines.find((line) => line.id === "lodging")!.detail.rooms).toBe(2);
    const mealsFamily = family.lines.find((line) => line.id === "meals")!.eur!;
    const mealsAdults = estimatePlanCosts(input({ adults: 3, childrenAges: [] })).lines.find(
      (line) => line.id === "meals"
    )!.eur!;
    expect(mealsFamily).toBeLessThan(mealsAdults);
  });

  it("names a Danube bridge without counting a fee it does not know", () => {
    const costs = estimatePlanCosts(input({ borderId: "danube-bridge-ruse" }));
    const bridge = costs.lines.find((line) => line.id === "bridge")!;
    expect(bridge.eur).toBeNull();
    expect(costs.incomplete).toBe(true);
    const without = estimatePlanCosts(input());
    expect(costs.total_eur).toBe(without.total_eur);
  });

  it("prices an electric car by the kWh", () => {
    const costs = estimatePlanCosts(input({ vehicle: { energy: "charge", consumption_per_100: 18 } }));
    const fuel = costs.lines.find((line) => line.id === "fuel")!;
    expect(fuel.detail.charge).toBe(1);
    expect(fuel.detail.kwh).toBe(270);
  });

  it("keeps the low and high around the total", () => {
    const costs = estimatePlanCosts(input());
    expect(costs.total_low).toBeLessThan(costs.total_eur);
    expect(costs.total_high).toBeGreaterThan(costs.total_eur);
    expect(costs.per_person_eur).toBeGreaterThan(0);
  });
});
