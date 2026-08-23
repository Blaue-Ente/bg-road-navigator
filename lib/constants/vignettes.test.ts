import { describe, expect, it } from "vitest";
import {
  getVignetteByCountryCode,
  OFFICIAL_VIGNETTE_LINKS,
  vignettesForCountryCodes,
  vignettesForCountryPairs,
} from "@/lib/constants/vignettes";

describe("official vignette links", () => {
  it("exposes only https official portals", () => {
    expect(OFFICIAL_VIGNETTE_LINKS.length).toBeGreaterThanOrEqual(6);
    for (const link of OFFICIAL_VIGNETTE_LINKS) {
      expect(link.official_url.startsWith("https://")).toBe(true);
    }
  });

  it("resolves country codes and pairs", () => {
    expect(getVignetteByCountryCode("at")?.country_code).toBe("AT");
    expect(getVignetteByCountryCode("Austria")?.country_code).toBe("AT");
    const fromPairs = vignettesForCountryPairs(["BG - RS", "AT - HU"]);
    expect(fromPairs.map((v) => v.country_code).sort()).toEqual([
      "AT",
      "BG",
      "HU",
    ]);
  });
});

describe("vignettesForCountryCodes", () => {
  it("returns official links for a route country set", () => {
    expect(
      vignettesForCountryCodes(["DE", "AT", "HU", "RS", "BG"]).map(
        (v) => v.country_code
      )
    ).toEqual(["BG", "AT", "HU"]);
  });
});
