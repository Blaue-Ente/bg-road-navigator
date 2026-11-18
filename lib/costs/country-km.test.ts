import { describe, expect, it } from "vitest";
import { kmByCountry } from "@/lib/costs/country-km";

describe("kilometres by country", () => {
  // A line due east along the equator: one degree is about 111 km.
  const line: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ];
  const countryAt = (lng: number) => (lng < 1 ? "AA" : lng < 2.5 ? "BB" : "CC");

  it("splits the route by where it is", () => {
    const km = kmByCountry(line, 333, countryAt, 5);
    expect(Object.keys(km).sort()).toEqual(["AA", "BB", "CC"]);
    expect(km.AA!).toBeGreaterThan(100);
    expect(km.AA!).toBeLessThan(120);
    expect(km.BB!).toBeGreaterThan(160);
    expect(km.BB!).toBeLessThan(175);
    expect(Object.values(km).reduce((sum, value) => sum + value, 0)).toBeCloseTo(333, 0);
  });

  it("scales to the road distance, not the straight line", () => {
    const km = kmByCountry(line, 400, countryAt, 5);
    expect(Object.values(km).reduce((sum, value) => sum + value, 0)).toBeCloseTo(400, 0);
  });

  it("lets a gap count for the country before it", () => {
    const km = kmByCountry(line, 333, (lng) => (lng < 1 ? "AA" : null), 5);
    expect(Object.keys(km)).toEqual(["AA"]);
  });

  it("answers with nothing for a degenerate line", () => {
    expect(kmByCountry([[0, 0]], 100, () => "AA")).toEqual({});
    expect(kmByCountry(line, 0, () => "AA")).toEqual({});
  });
});
