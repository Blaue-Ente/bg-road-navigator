import { describe, expect, it } from "vitest";
import { applyPreferredBorder } from "@/lib/planner/borders";
import {
  allowsBorder,
  costingFromPreferences,
  DEFAULT_TRIP_PREFERENCES,
  detourLimitKm,
  drivingDayLimits,
  effectiveBreakEveryMin,
  healthDayLimitH,
  placePreferenceScore,
  resolveDeparture,
  resolveTripPreferences,
  scenicTypes,
  type TripPreferences,
} from "@/lib/planner/preferences";
import type { ScoredBorder } from "@/lib/planner/borders";

function prefs(patch: Partial<TripPreferences> = {}): TripPreferences {
  return { ...DEFAULT_TRIP_PREFERENCES, ...patch };
}

describe("fuel stop preference", () => {
  it("keeps an on-route station and rejects a long detour", () => {
    const onRoute = prefs({ fuel_stop: "on_route", max_detour_min: 8 });
    expect(detourLimitKm(onRoute)).toBe(0.8);
    const service = placePreferenceScore(
      {
        kind: "fuel",
        tags: {},
        motorwayService: true,
        detourKm: 0.2,
      },
      onRoute
    );
    const detour = placePreferenceScore(
      { kind: "fuel", tags: {}, motorwayService: false, detourKm: 2.5 },
      onRoute
    );
    expect(service).toBeGreaterThan(detour);
  });

  it("allows a nearby detour only inside the minute cap", () => {
    const nearby = prefs({ fuel_stop: "detour", max_detour_min: 9 });
    expect(detourLimitKm(nearby)).toBe(3);
    const close = placePreferenceScore(
      { kind: "fuel", tags: {}, motorwayService: false, detourKm: 2 },
      nearby
    );
    const far = placePreferenceScore(
      { kind: "fuel", tags: {}, motorwayService: false, detourKm: 5 },
      nearby
    );
    expect(close).toBeGreaterThan(0);
    expect(far).toBeLessThan(0);
  });
});

describe("break interval", () => {
  it("uses the requested interval when nobody is a small child", () => {
    expect(effectiveBreakEveryMin(prefs({ break_every_min: 150 }))).toBe(150);
  });
});

describe("travelling with a pet", () => {
  it("prefers a pet-friendly stop with a green area", () => {
    const trip = prefs({ with_pet: true });
    const park = placePreferenceScore(
      {
        kind: "rest_area",
        tags: { dog: "yes", leisure: "park" },
        motorwayService: false,
        detourKm: 0.5,
      },
      trip
    );
    const plain = placePreferenceScore(
      {
        kind: "restaurant",
        tags: {},
        motorwayService: false,
        detourKm: 0.5,
      },
      trip
    );
    expect(park).toBeGreaterThan(plain);
  });
});

describe("avoid motorways and tolls", () => {
  it("turns highways and tolls off in the Valhalla costing", () => {
    expect(
      costingFromPreferences(
        prefs({ avoid_motorways: true, avoid_tolls: true })
      )
    ).toMatchObject({ useHighways: false, useTolls: false });
    expect(costingFromPreferences(prefs())).toMatchObject({
      useHighways: true,
      useTolls: true,
    });
  });
});

describe("overnight and drivers", () => {
  it("skips the overnight window when the trip is a day drive", () => {
    expect(drivingDayLimits(prefs({ overnight: false })).overnight).toBe(
      false
    );
  });

  it("lets a second driver extend the driving day", () => {
    const one = drivingDayLimits(prefs({ drivers: 1, max_driving_hours: 10 }));
    const two = drivingDayLimits(prefs({ drivers: 2, max_driving_hours: 10 }));
    expect(two.overnightAfterMin - one.overnightAfterMin).toBe(120);
  });
});

describe("fast or scenic", () => {
  it("asks for sights only on a scenic pace", () => {
    expect(scenicTypes(prefs({ pace: "fast" }))).toEqual([]);
    expect(scenicTypes(prefs({ pace: "scenic" }))).toEqual([
      "attraction",
      "viewpoint",
    ]);
  });
});

describe("children", () => {
  it("shortens the break when a child is under five", () => {
    expect(
      effectiveBreakEveryMin(
        prefs({
          with_children: true,
          children_ages: [3, 8],
          break_every_min: 135,
        })
      )
    ).toBe(75);
  });

  it("prefers a playground and a family restaurant", () => {
    const trip = prefs({ with_children: true, children_ages: [6] });
    const family = placePreferenceScore(
      {
        kind: "restaurant",
        tags: { cuisine: "family", playground: "yes" },
        motorwayService: false,
        detourKm: 0.4,
      },
      trip
    );
    const plain = placePreferenceScore(
      {
        kind: "restaurant",
        tags: {},
        motorwayService: false,
        detourKm: 0.4,
      },
      trip
    );
    expect(family).toBeGreaterThan(plain);
  });
});

describe("departure and borders", () => {
  it("uses the requested departure, then the saved one", () => {
    const now = new Date("2026-11-15T08:00:00.000Z");
    const saved = prefs({ depart_at: "2026-11-16T06:00:00.000Z" });
    expect(
      resolveDeparture(saved, "2026-11-20T09:30:00.000Z", now).toISOString()
    ).toBe("2026-11-20T09:30:00.000Z");
    expect(resolveDeparture(saved, undefined, now).toISOString()).toBe(
      "2026-11-16T06:00:00.000Z"
    );
  });

  it("drops an avoided border and keeps a preferred one chosen", () => {
    expect(allowsBorder("kalotina", prefs({ avoid_borders: ["kalotina"] }))).toBe(
      false
    );
    const scored = applyPreferredBorder(
      [
        border("kapitan-andreevo", 80, true),
        border("kalotina", 100, false),
      ],
      "kalotina"
    );
    expect(scored.find((item) => item.chosen)?.borderId).toBe("kalotina");
  });
});

describe("resolveTripPreferences", () => {
  it("fills defaults and lets the request override the profile", () => {
    const resolved = resolveTripPreferences(
      { with_pet: true, drivers: 2 },
      { avoid_tolls: true, drivers: 1 }
    );
    expect(resolved.with_pet).toBe(true);
    expect(resolved.avoid_tolls).toBe(true);
    expect(resolved.drivers).toBe(2);
    expect(resolved.break_every_min).toBe(135);
  });
});

function border(id: string, total: number, chosen: boolean): ScoredBorder {
  return {
    borderId: id,
    nameBg: id,
    nameEn: id,
    coords: { lng: 23, lat: 42 },
    ppid: null,
    driveMin: total,
    distanceKm: 100,
    wait: {
      source: "unavailable",
      estimate: true,
      minutes: 0,
      metric: "none",
      quality: null,
      queue_now: null,
      observed_at: null,
      age_min: null,
      age_label: "",
      label_bg: "",
      attribution: null,
    },
    communityPenaltyMin: 0,
    totalMin: total,
    chosen,
    reasonCode: chosen ? "lowest_total" : "slower_than_best",
    reason: "",
  };
}

describe("car size", () => {
  it("a small car gets closer stops and a shorter driving day", () => {
    const standard = prefs({ break_every_min: 135 });
    const compact = prefs({ break_every_min: 135, car_comfort: "compact" });
    expect(effectiveBreakEveryMin(standard)).toBe(135);
    expect(effectiveBreakEveryMin(compact)).toBe(105);
    expect(drivingDayLimits(compact).overnightAfterMin).toBe(
      drivingDayLimits(standard).overnightAfterMin - 90
    );
  });

  it("keeps the exact interval the driver chose", () => {
    const exact = prefs({ break_every_min: 150, break_exact: true, car_comfort: "compact" });
    expect(effectiveBreakEveryMin(exact)).toBe(150);
  });

  it("a roomy car changes nothing", () => {
    expect(effectiveBreakEveryMin(prefs({ car_comfort: "roomy" }))).toBe(135);
  });
});

describe("health day limit", () => {
  it("is 10 hours without children and 8 with them, and caps the planned day", () => {
    expect(healthDayLimitH(prefs())).toBe(10);
    expect(healthDayLimitH(prefs({ with_children: true }))).toBe(8);
    expect(drivingDayLimits(prefs({ max_driving_hours: 12 })).overnightAfterMin).toBe(600);
    expect(
      drivingDayLimits(prefs({ max_driving_hours: 12, with_children: true })).overnightAfterMin
    ).toBe(480);
  });
});

describe("night swap", () => {
  it("lifts the day to seven hours a driver, with a cap, only with two or more drivers", () => {
    expect(healthDayLimitH(prefs({ night_mode: "swap", drivers: 1 }))).toBe(10);
    expect(healthDayLimitH(prefs({ night_mode: "swap", drivers: 2 }))).toBe(14);
    expect(healthDayLimitH(prefs({ night_mode: "swap", drivers: 3 }))).toBe(16);
    expect(healthDayLimitH(prefs({ night_mode: "swap", drivers: 3, with_children: true }))).toBe(12);
    expect(healthDayLimitH(prefs({ night_mode: "sleep", drivers: 3 }))).toBe(10);
  });

  it("plans a longer driving day when the drivers swap", () => {
    const sleep = drivingDayLimits(prefs({ drivers: 2, night_mode: "sleep" })).overnightAfterMin;
    const swap = drivingDayLimits(prefs({ drivers: 2, night_mode: "swap" })).overnightAfterMin;
    expect(swap).toBeGreaterThan(sleep);
  });
});
