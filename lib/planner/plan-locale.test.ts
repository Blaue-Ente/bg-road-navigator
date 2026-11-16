import { describe, expect, it } from "vitest";
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

const SKIP = ["name_bg", "nameBg", "nameEn", "label_bg_source"];

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
      const reasons = whyThisRoute({
        locale,
        borders: [
          {
            chosen: true,
            name: "Kapitan Andreevo",
            totalMin: 200,
            waitMinutes: 20,
            driveMin: 180,
            distanceKm: 320,
          },
          {
            chosen: false,
            name: "Danube Bridge Vidin–Calafat",
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
      expect(reasons[0]?.title).toContain("Kapitan Andreevo");
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
});