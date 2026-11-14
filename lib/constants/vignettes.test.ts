import { describe, expect, it } from "vitest";
import {
  getVignetteByCountryCode,
  OFFICIAL_VIGNETTE_LINKS,
  vignettesForCountryPairs,
} from "@/lib/constants/vignettes";

describe("official vignette links", () => {
  it("exposes only https official portals", () => {
    expect(OFFICIAL_VIGNETTE_LINKS.length).toBeGreaterThanOrEqual(8);
    for (const link of OFFICIAL_VIGNETTE_LINKS) {
      expect(link.official_url.startsWith("https://")).toBe(true);
      expect(link.kind === "vignette" || link.kind === "distance_toll").toBe(
        true
      );
    }
  });

  it("points Romania, Hungary and Switzerland at the official sellers", () => {
    expect(getVignetteByCountryCode("RO")?.official_url).toBe(
      "https://etoll.ro"
    );
    expect(getVignetteByCountryCode("RO")?.official_url).not.toContain(
      "roviniete"
    );
    expect(getVignetteByCountryCode("HU")?.official_url).toBe(
      "https://ematrica.nemzetiutdij.hu/en/vignette-purchase/"
    );
    expect(getVignetteByCountryCode("CH")?.official_url).toBe(
      "https://via.admin.ch/shop"
    );
  });

  it("models Serbia, Croatia and Turkey as distance tolls", () => {
    for (const code of ["RS", "HR", "TR"]) {
      const link = getVignetteByCountryCode(code);
      expect(link?.kind).toBe("distance_toll");
      expect(link?.official_url.startsWith("https://")).toBe(true);
    }
    expect(getVignetteByCountryCode("BG")?.kind).toBe("vignette");
  });

  it("resolves country codes and pairs", () => {
    expect(getVignetteByCountryCode("at")?.country_code).toBe("AT");
    expect(getVignetteByCountryCode("Austria")?.country_code).toBe("AT");
    expect(getVignetteByCountryCode("Turkey")?.country_code).toBe("TR");
    const fromPairs = vignettesForCountryPairs(["BG - RS", "AT - HU"]);
    expect(fromPairs.map((v) => v.country_code).sort()).toEqual([
      "AT",
      "BG",
      "HU",
      "RS",
    ]);
    expect(fromPairs.find((v) => v.country_code === "RS")?.kind).toBe(
      "distance_toll"
    );
  });
});
