import { describe, expect, it } from "vitest";
import {
  BORDER_CROSSINGS,
  borderDisplayName,
} from "@/lib/constants/border-crossings";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import {
  collectStrings,
  stringsWithoutCyrillic,
} from "@/lib/planner/collect-strings";
import {
  applyPreferredBorder,
  scoreBorderOptions,
} from "@/lib/planner/borders";
import { buildRouteOptions } from "@/lib/planner/route-options";
import type { ScoredBorder } from "@/lib/planner/borders";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";
import type { WaitEstimate } from "@/lib/planner/types";
import { expectedWait } from "@/lib/planner/wait";
import { whyThisRoute } from "@/lib/planner/why-route";
import { NAKORDONI_ATTRIBUTION } from "@/lib/planner/wait";
import type { Locale } from "@/lib/i18n/locale";
import { weatherCondition } from "@/lib/utils/weather-codes";
import {
  hotspotReason,
  hotspotWarnings,
} from "@/lib/hotspots/present";
import { hazardReason, hazardWarnings } from "@/lib/hazards/present";
import { countryAverageLabel } from "@/lib/fuel-prices/present";
import { catalog } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { Hotspot } from "@/lib/hotspots/types";
import { parseDatexSituations } from "@/lib/hazards/datex-parse";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKIP = ["name_bg", "nameBg", "nameEn", "label_bg_source"];
const ENGLISH_BORDER_WORDS = /\b(Bridge|Danube)\b/i;

function expectNoCyrillic(locale: Locale, value: unknown) {
  const bad = stringsWithoutCyrillic(collectStrings(value, { skipKeys: SKIP }));
  expect(bad, `Cyrillic in ${locale}: ${bad.join(" | ")}`).toEqual([]);
}

const waitFixture: WaitEstimate = {
  source: "current",
  estimate: true,
  minutes: 25,
  metric: "wait_min",
  quality: "high",
  queue_now: 25,
  observed_at: "2026-11-14T12:00:00.000Z",
  age_min: 20,
  age_label: "x",
  label_bg: "x",
  attribution: NAKORDONI_ATTRIBUTION,
};

describe("plan locale outputs", () => {
  for (const locale of ["en", "tr", "ro"] as const) {
    it(`whyThisRoute has no Cyrillic for ${locale}`, () => {
      const kapitan = BORDER_CROSSINGS.find(
        (row) => row.id === "kapitan-andreevo"
      )!;
      const vidin = BORDER_CROSSINGS.find(
        (row) => row.id === "danube-bridge-vidin"
      )!;
      const reasons = whyThisRoute({
        locale,
        borders: [
          {
            chosen: true,
            borderId: kapitan.id,
            nameBg: kapitan.name_bg,
            nameEn: kapitan.name_en,
            totalMin: 200,
            waitMinutes: 20,
            driveMin: 180,
            distanceKm: 320,
          },
          {
            chosen: false,
            borderId: vidin.id,
            nameBg: vidin.name_bg,
            nameEn: vidin.name_en,
            totalMin: 260,
            waitMinutes: 70,
            driveMin: 190,
            distanceKm: 340,
          },
        ],
        directDurationMin: 240,
        directDistanceKm: 360,
        chosenDurationMin: 180,
        chosenDistanceKm: 320,
        incidents: [],
        preferences: DEFAULT_TRIP_PREFERENCES,
      });
      expectNoCyrillic(locale, reasons);
      const title = reasons[0]?.title ?? "";
      if (locale === "tr") expect(title).toBe("Kapıkule üzerinden");
      else if (locale === "ro") expect(title).toBe("Prin Capitan Andreevo");
      else expect(title).toBe("Via Kapitan Andreevo");
    });

    it(`scoreBorderOptions has no Cyrillic for ${locale}`, () => {
      const scored = scoreBorderOptions(
        [
          {
            borderId: "kalotina",
            nameBg: "Калотина",
            nameEn: "Kalotina",
            coords: { lng: 22.9, lat: 42.98 },
            ppid: "id_1",
            driveMin: 800,
            distanceKm: 1050,
            wait: { ...waitFixture, minutes: 25 },
            communityPenaltyMin: 0,
          },
          {
            borderId: "kapitan-andreevo",
            nameBg: "Капитан Андреево",
            nameEn: "Kapitan Andreevo",
            coords: { lng: 26.37, lat: 41.72 },
            ppid: "id_2",
            driveMin: 760,
            distanceKm: 1100,
            wait: { ...waitFixture, minutes: 90 },
            communityPenaltyMin: 0,
          },
        ],
        locale
      );
      expectNoCyrillic(locale, scored);
      expect(scored[0]?.reason).toMatch(/Kalotina|Kapitan|Kapıkule/i);
    });

    it(`expectedWait has no Cyrillic for ${locale}`, () => {
      const eta = new Date("2026-11-14T15:10:00.000Z");
      const wait = expectedWait({
        eta,
        now: eta,
        locale,
        forecast: [
          { at: "2026-11-14T15:00:00.000Z", hour: 15, waitMin: 12, queue: 4 },
        ],
        dayStats: null,
        current: null,
        localTypical: Array(24).fill(8),
      });
      expectNoCyrillic(locale, wait);
    });
  }

  it("buildRouteOptions labels via Kapıkule in Turkish", () => {
    const coords: Array<[number, number]> = [
      [23.32, 42.7],
      [26.37, 41.72],
    ];
    const direct: ProvidedRoadRoute = {
      provider: "valhalla",
      distance_km: 400,
      duration_min: 400,
      geometry: { type: "LineString", coordinates: coords },
      maneuvers: [],
      alternatives: [],
    };
    const chosen: ScoredBorder = {
      borderId: "kapitan-andreevo",
      nameBg: "Капитан Андреево",
      nameEn: "Kapitan Andreevo",
      coords: { lng: 26.37, lat: 41.72 },
      ppid: null,
      driveMin: 400,
      distanceKm: 400,
      wait: waitFixture,
      communityPenaltyMin: 0,
      totalMin: 425,
      chosen: true,
      reasonCode: "lowest_total",
      reason: "test",
    };
    const options = buildRouteOptions({
      origin: { lng: 23.32, lat: 42.7 },
      destination: { lng: 41.01, lat: 28.98 },
      originCountry: "BG",
      destinationCountry: "TR",
      direct,
      viaRoutes: new Map(),
      onPath: new Set(["kapitan-andreevo"]),
      borders: [chosen],
      chosenRoute: direct,
      chosenBorder: chosen,
      preferences: DEFAULT_TRIP_PREFERENCES,
      locale: "tr",
    });
    expect(options.primary.label).toMatch(/Kapıkule üzerinden/);
    expectNoCyrillic("tr", options);
  });

  it("buildRouteOptions labels Via Kapitan Andreevo in English", () => {
    const coords: Array<[number, number]> = [
      [23.32, 42.7],
      [26.37, 41.72],
    ];
    const direct: ProvidedRoadRoute = {
      provider: "valhalla",
      distance_km: 400,
      duration_min: 400,
      geometry: { type: "LineString", coordinates: coords },
      maneuvers: [],
      alternatives: [],
    };
    const chosen: ScoredBorder = {
      borderId: "kapitan-andreevo",
      nameBg: "Капитан Андреево",
      nameEn: "Kapitan Andreevo",
      coords: { lng: 26.37, lat: 41.72 },
      ppid: null,
      driveMin: 400,
      distanceKm: 400,
      wait: waitFixture,
      communityPenaltyMin: 0,
      totalMin: 425,
      chosen: true,
      reasonCode: "lowest_total",
      reason: "test",
    };
    const options = buildRouteOptions({
      origin: { lng: 23.32, lat: 42.7 },
      destination: { lng: 41.01, lat: 28.98 },
      originCountry: "BG",
      destinationCountry: "TR",
      direct,
      viaRoutes: new Map(),
      onPath: new Set(["kapitan-andreevo"]),
      borders: [chosen],
      chosenRoute: direct,
      chosenBorder: chosen,
      preferences: DEFAULT_TRIP_PREFERENCES,
      locale: "en",
    });
    expect(options.primary.label).toBe("Via Kapitan Andreevo");
  });

  for (const locale of ["tr", "ro"] as const) {
    it(`whyThisRoute names match borderDisplayName for every crossing (${locale})`, () => {
      for (const chosenRow of BORDER_CROSSINGS) {
        const otherRow =
          BORDER_CROSSINGS.find((row) => row.id !== chosenRow.id) ??
          BORDER_CROSSINGS[0]!;
        const reasons = whyThisRoute({
          locale,
          borders: [
            {
              chosen: true,
              borderId: chosenRow.id,
              nameBg: chosenRow.name_bg,
              nameEn: chosenRow.name_en,
              totalMin: 200,
              waitMinutes: 20,
              driveMin: 180,
              distanceKm: 320,
            },
            {
              chosen: false,
              borderId: otherRow.id,
              nameBg: otherRow.name_bg,
              nameEn: otherRow.name_en,
              totalMin: 280,
              waitMinutes: 50,
              driveMin: 190,
              distanceKm: 340,
            },
          ],
          directDurationMin: 240,
          directDistanceKm: 360,
          chosenDurationMin: 180,
          chosenDistanceKm: 320,
          incidents: [],
          preferences: DEFAULT_TRIP_PREFERENCES,
        });
        const borderWhy = reasons.find((reason) => reason.code === "border_wait");
        expect(borderWhy).toBeDefined();
        const blob = `${borderWhy!.title} ${borderWhy!.detail}`;
        const chosenName = borderDisplayName(locale, chosenRow);
        const otherName = borderDisplayName(locale, otherRow);
        expect(blob).toContain(chosenName);
        expect(blob).toContain(otherName);
        expect(blob).not.toMatch(ENGLISH_BORDER_WORDS);
        for (const row of [chosenRow, otherRow]) {
          if (ENGLISH_BORDER_WORDS.test(row.name_en)) {
            expect(blob).not.toContain(row.name_en);
          }
        }
      }
    });
  }

  it("applyPreferredBorder localizes preferred reason", () => {
    const scored = applyPreferredBorder(
      [
        {
          borderId: "kalotina",
          nameBg: "Калотина",
          nameEn: "Kalotina",
          coords: { lng: 22.9, lat: 42.98 },
          ppid: null,
          driveMin: 400,
          distanceKm: 400,
          wait: waitFixture,
          communityPenaltyMin: 0,
          totalMin: 425,
          chosen: false,
          reasonCode: "slower_than_best",
          reason: "x",
        },
      ],
      "kalotina",
      "en"
    );
    expect(scored[0]?.reason).toMatch(/Preferred.*Kalotina/i);
    expectNoCyrillic("en", scored);
  });

  const hotspotFixture: Hotspot = {
    id: "x",
    country: "DE",
    lng: 23,
    lat: 42,
    count: 5,
    fatal: 0,
    serious: 1,
    slight: 0,
    severity: 2,
    source_id: "de-unfallatlas",
    year_from: 2022,
    year_to: 2023,
  };

  const hazardXml = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../hazards/fixtures/datex-situations.xml"),
    "utf8"
  );
  const hazardFixture = parseDatexSituations(hazardXml, {
    now: new Date("2026-11-15T12:00:00.000Z"),
  })[0]!;

  for (const locale of ["en", "tr", "ro"] as const) {
    it(`planner II presenters have no Cyrillic for ${locale}`, () => {
      expectNoCyrillic(locale, {
        weather: weatherCondition(61, locale),
        hotspot: hotspotWarnings([hotspotFixture], locale),
        hazard: hazardWarnings([hazardFixture], locale),
        fuel: countryAverageLabel({
          countryName: "Germany",
          fuel: "diesel",
          price: 1.8,
          locale,
        }),
        lodging: formatTemplate(catalog(locale).planner.stops.lodgingNearby, {
          name: "Hotel",
        }),
      });
    });
  }

  it("hotspot and hazard reasons localize", () => {
    const attention = hotspotReason([hotspotFixture], "en");
    const hazard = hazardReason([hazardFixture], "tr");
    expectNoCyrillic("en", attention);
    expectNoCyrillic("tr", hazard);
  });
});