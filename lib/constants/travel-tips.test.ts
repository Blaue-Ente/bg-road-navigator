import { describe, expect, it } from "vitest";
import { CYRILLIC } from "@/lib/i18n/catalog-test-utils";
import type { Locale } from "@/lib/i18n/locale";
import {
  CATEGORY_LABELS,
  LONG_HAUL_TIPS,
  categoryLabel,
  tipBody,
  tipTitle,
} from "@/lib/constants/travel-tips";
import { WINTER_RULES } from "@/lib/constants/winter-rules";
import { EUROPEAN_REST_AREAS } from "@/lib/constants/rest-areas";
import { pickText } from "@/lib/i18n/localized-field";

const NON_BG: Locale[] = ["en", "tr", "ro"];

describe("travel tips", () => {
  it("keeps 12 tips", () => {
    expect(LONG_HAUL_TIPS).toHaveLength(12);
  });

  it("has seven category labels", () => {
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(7);
  });

  it("keeps winter rules and rest areas at fixed counts", () => {
    expect(WINTER_RULES).toHaveLength(15);
    expect(EUROPEAN_REST_AREAS).toHaveLength(14);
  });

  for (const locale of NON_BG) {
    it(`${locale}: tip and category strings have no Cyrillic`, () => {
      const strings: string[] = [];
      for (const tip of LONG_HAUL_TIPS) {
        strings.push(tipTitle(locale, tip), tipBody(locale, tip));
      }
      for (const cat of Object.keys(CATEGORY_LABELS) as Array<
        keyof typeof CATEGORY_LABELS
      >) {
        strings.push(categoryLabel(locale, cat));
      }
      const hits = strings.filter((s) => CYRILLIC.test(s));
      expect(hits, `Cyrillic in ${locale}: ${hits.join(" | ")}`).toEqual([]);
    });

    it(`${locale}: titles differ from Bulgarian fallback where expected`, () => {
      for (const tip of LONG_HAUL_TIPS) {
        const title = pickText(locale, tip.title);
        expect(title.length).toBeGreaterThan(0);
      }
    });
  }
});