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

  it("points Bulgaria and Romania at the official purchase pages", () => {
    expect(getVignetteByCountryCode("BG")?.official_url).toBe(
      "https://web.bgtoll.bg/"
    );
    expect(getVignetteByCountryCode("BG")?.link_role).toBe("shop");
    expect(getVignetteByCountryCode("RO")?.official_url).toBe(
      "https://portal.etoll.ro/vinieta-ro"
    );
    expect(getVignetteByCountryCode("RO")?.link_role).toBe("shop");
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
    expect(getVignetteByCountryCode("RS")?.link_role).toBe("info");
    expect(getVignetteByCountryCode("HR")?.link_role).toBe("info");
  });

  it("labels every official link as shop or info", () => {
    for (const link of OFFICIAL_VIGNETTE_LINKS) {
      expect(link.link_role === "shop" || link.link_role === "info").toBe(true);
    }
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
