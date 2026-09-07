import { describe, expect, it } from "vitest";
import { searchCuratedCities } from "@/lib/constants/european-cities";

describe("searchCuratedCities", () => {
  it("matches Bulgarian city names from the first letters", () => {
    const results = searchCuratedCities("Соф");
    expect(results[0]?.id).toBe("sofia");
    expect(results[0]?.countryCode).toBe("BG");
  });

  it("matches country names and ISO codes", () => {
    expect(
      searchCuratedCities("DE").some((city) => city.countryCode === "DE")
    ).toBe(true);
    expect(
      searchCuratedCities("унгар").some((city) => city.countryCode === "HU")
    ).toBe(true);
  });

  it("returns nothing for an empty query", () => {
    expect(searchCuratedCities("   ")).toEqual([]);
  });
});
