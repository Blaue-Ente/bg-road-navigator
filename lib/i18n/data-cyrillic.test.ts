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
  }
});