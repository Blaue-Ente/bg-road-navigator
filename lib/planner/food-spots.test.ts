import { describe, expect, it } from "vitest";
import { chainOf, foodChainSpots } from "@/lib/planner/food-spots";
import type { AnnotatedPlace } from "@/lib/planner/pick-place";

function place(
  id: string,
  name: string,
  alongKm: number,
  detourKm = 0.5,
  kind: AnnotatedPlace["kind"] = "restaurant",
  brand: string | null = null
): AnnotatedPlace {
  return {
    id,
    name,
    brand,
    lat: 45,
    lng: 20,
    kind,
    motorwayService: false,
    tags: {},
    alongM: alongKm * 1000,
    distM: 100,
    source: "poi",
    alongKm,
    detourKm,
    priceAmount: null,
    nationalAvgPerL: null,
    priceBasis: null,
    priceSource: null,
    observedAt: null,
    savingsEur: null,
  };
}

describe("food chain spots", () => {
  it("recognises the chains by brand or by name", () => {
    expect(chainOf({ brand: "KFC", name: "Restaurant" })).toBe("KFC");
    expect(chainOf({ brand: null, name: "McDonald's Arad" })).toBe("McDonald's");
    expect(chainOf({ brand: null, name: "Pizzeria Roma" })).toBeNull();
  });

  it("keeps chains near the road, spaced apart, with a driving time", () => {
    const spots = foodChainSpots(
      [
        place("a", "McDonald's", 200),
        place("b", "KFC", 215),
        place("c", "Burger King", 300),
        place("d", "Burger King far", 400, 9),
        place("e", "Local grill", 500),
        place("f", "McDonald's", 600, 0.2, "fuel"),
      ],
      { distanceKm: 1000, driveMin: 600 }
    );
    expect(spots.map((spot) => spot.id)).toEqual(["a", "c"]);
    expect(spots[0]?.etaMin).toBeCloseTo(120);
    expect(spots[0]?.chain).toBe("McDonald's");
  });
});

describe("chain names written in Cyrillic", () => {
  it("are recognised too", () => {
    expect(chainOf({ brand: null, name: "Макдоналдс" })).toBe("McDonald's");
  });
});
