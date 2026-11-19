import { describe, expect, it } from "vitest";
import { CYRILLIC } from "@/lib/i18n/catalog-test-utils";
import {
  COUNTRY_TIPS,
  countriesWithTips,
  countryTipBody,
  countryTipTitle,
  tipsForCountry,
} from "@/lib/constants/country-tips";
import { EMERGENCY_DATA } from "@/lib/constants/emergency-numbers";

describe("country tips", () => {
  it("has unique ids and a tip for each listed country", () => {
    const ids = COUNTRY_TIPS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const code of countriesWithTips()) {
      expect(tipsForCountry(code).length).toBeGreaterThan(0);
    }
  });

  it("only uses countries that have emergency data", () => {
    const known = new Set(EMERGENCY_DATA.map((r) => r.country_code));
    for (const code of countriesWithTips()) expect(known.has(code)).toBe(true);
  });

  for (const locale of ["en", "tr", "ro"] as const) {
    it(`${locale}: no Cyrillic`, () => {
      const hits = COUNTRY_TIPS.flatMap((t) => [
        countryTipTitle(locale, t),
        countryTipBody(locale, t),
      ]).filter((s) => CYRILLIC.test(s));
      expect(hits).toEqual([]);
    });
  }
});
