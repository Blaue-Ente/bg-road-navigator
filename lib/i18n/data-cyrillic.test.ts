import { describe, expect, it } from "vitest";
import { CYRILLIC } from "@/lib/i18n/catalog-test-utils";
import type { Locale } from "@/lib/i18n/locale";
import {
  BORDER_CROSSINGS,
  borderDisplayName,
  borderNotesText,
  type BorderDocument,
  type BorderVehicle,
} from "@/lib/constants/border-crossings";
import { MAP_LAYERS } from "@/lib/constants/map-layers";
import {
  OFFICIAL_LINK_LABELS,
  HATARINFO_ATTRIBUTION_LABEL,
} from "@/lib/constants/border-official-links";
import { catalog } from "@/lib/i18n/locale";
import {
  OFFICIAL_VIGNETTE_LINKS,
  formatVignetteValidity,
} from "@/lib/constants/vignettes";
import {
  EMERGENCY_DATA,
  emergencyNotesText,
  emergencyRoadsideName,
} from "@/lib/constants/emergency-numbers";
import { countryName } from "@/lib/geo/country-name";
import { pickText } from "@/lib/i18n/localized-field";
import {
  CATEGORY_LABELS,
  LONG_HAUL_TIPS,
  categoryLabel,
  tipBody,
  tipTitle,
} from "@/lib/constants/travel-tips";
import {
  WINTER_RULES,
  WINTER_RULES_DISCLAIMER,
  winterRuleChains,
  winterRulePeriod,
  winterRuleSummary,
} from "@/lib/constants/winter-rules";
import { ROAD_SAFETY } from "@/lib/i18n/road-safety";
import {
  EUROPEAN_REST_AREAS,
  restAreaLocation,
  restAreaName,
  restAreaNotes,
} from "@/lib/constants/rest-areas";

const NON_BG: Locale[] = ["en", "tr", "ro"];

export function expectNoCyrillic(label: string, values: string[]): void {
  const hits = values.filter((value) => CYRILLIC.test(value));
  expect(hits, `${label} contains Cyrillic: ${hits.join(" | ")}`).toEqual([]);
}

describe("localized border and map data", () => {
  for (const locale of NON_BG) {
    it(`${locale}: border display names have no Cyrillic`, () => {
      const names = BORDER_CROSSINGS.map((row) =>
        borderDisplayName(locale, row)
      );
      expectNoCyrillic(`border names (${locale})`, names);
    });

    it(`${locale}: border notes have no Cyrillic`, () => {
      const notes = BORDER_CROSSINGS.map((row) =>
        borderNotesText(locale, row)
      );
      expectNoCyrillic(`border notes (${locale})`, notes);
    });

    it(`${locale}: document and vehicle catalog labels have no Cyrillic`, () => {
      const m = catalog(locale);
      const docLabels = (
        Object.keys(m.borders.doc) as BorderDocument[]
      ).map((key) => m.borders.doc[key]);
      const vehicleLabels = (
        Object.keys(m.borders.vehicle) as BorderVehicle[]
      ).map((key) => m.borders.vehicle[key]);
      expectNoCyrillic(`border docs (${locale})`, [
        ...docLabels,
        ...vehicleLabels,
        m.borders.documentsEu,
        m.borders.documentsOther,
      ]);
    });

    it(`${locale}: map layer labels have no Cyrillic`, () => {
      const labels = MAP_LAYERS.map((layer) => layer.label[locale]);
      expectNoCyrillic(`map layers (${locale})`, labels);
    });

    it(`${locale}: official link labels have no Cyrillic`, () => {
      const labels = [
        ...Object.values(OFFICIAL_LINK_LABELS).map((row) => row[locale]),
        HATARINFO_ATTRIBUTION_LABEL[locale],
      ];
      expectNoCyrillic(`official links (${locale})`, labels);
    });

    it(`${locale}: vignette names, notes and validity have no Cyrillic`, () => {
      const strings: string[] = [];
      for (const link of OFFICIAL_VIGNETTE_LINKS) {
        strings.push(pickText(locale, link.name));
        if (link.notes) strings.push(pickText(locale, link.notes));
        if (link.validity) strings.push(pickText(locale, link.validity));
        const line = formatVignetteValidity(link, locale);
        if (line) strings.push(line);
      }
      expectNoCyrillic(`vignettes (${locale})`, strings);
    });

    it(`${locale}: emergency country names, notes and roadside labels have no Cyrillic`, () => {
      const strings: string[] = [];
      for (const row of EMERGENCY_DATA) {
        strings.push(countryName(row.country_code, locale));
        strings.push(emergencyNotesText(locale, row));
        strings.push(emergencyRoadsideName(locale, row));
      }
      expectNoCyrillic(`emergency (${locale})`, strings);
    });

    it(`${locale}: travel tips have no Cyrillic`, () => {
      const strings: string[] = [];
      for (const tip of LONG_HAUL_TIPS) {
        strings.push(tipTitle(locale, tip), tipBody(locale, tip));
      }
      for (const cat of Object.keys(CATEGORY_LABELS) as Array<
        keyof typeof CATEGORY_LABELS
      >) {
        strings.push(categoryLabel(locale, cat));
      }
      expectNoCyrillic(`travel tips (${locale})`, strings);
    });

    it(`${locale}: winter rules have no Cyrillic`, () => {
      const strings: string[] = [pickText(locale, WINTER_RULES_DISCLAIMER)];
      for (const rule of WINTER_RULES) {
        strings.push(
          winterRuleSummary(locale, rule),
          winterRulePeriod(locale, rule),
          winterRuleChains(locale, rule)
        );
      }
      expectNoCyrillic(`winter rules (${locale})`, strings);
    });

    it(`${locale}: Bulgaria road-safety copy has no Cyrillic`, () => {
      const block = ROAD_SAFETY[locale];
      const strings = [
        block.title,
        block.law_label,
        block.advice_label,
        block.closing,
        ...block.law.flatMap((item) => [item.title, item.detail]),
        ...block.advice.flatMap((item) => [item.title, item.detail]),
        ...block.links.flatMap((item) => [
          item.title,
          item.detail,
          item.link_label,
        ]),
      ];
      expectNoCyrillic(`road safety (${locale})`, strings);
    });

    it(`${locale}: rest areas have no Cyrillic`, () => {
      const strings: string[] = [];
      for (const area of EUROPEAN_REST_AREAS) {
        strings.push(restAreaName(locale, area), restAreaLocation(locale, area));
        const notes = restAreaNotes(locale, area);
        if (notes) strings.push(notes);
      }
      expectNoCyrillic(`rest areas (${locale})`, strings);
    });
  }
});