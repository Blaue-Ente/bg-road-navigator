import { describe, expect, it } from "vitest";
import { isHarshWeather, tripNotices } from "@/lib/trip/notices";
import type { TripProgress } from "@/lib/trip/progress";
import type { PlanStop, TripPlannerResult } from "@/lib/planner/types";
import { resolveTripPreferences } from "@/lib/planner/preferences";

const stop = (id: string, km: number, extra: Partial<PlanStop> = {}) =>
  ({
    id,
    title: id,
    kinds: ["fuel"],
    optional: false,
    distance_from_start_km: km,
    advice: null,
    ...extra,
  }) as PlanStop;

function plan(extra: Partial<TripPlannerResult> = {}): TripPlannerResult {
  return {
    route: { distance_km: 600, duration_min: 360 },
    preferences: resolveTripPreferences({ break_every_min: 120 }),
    stops: [],
    weather: { segments: [], warnings: [], attribution: "" },
    ...extra,
  } as unknown as TripPlannerResult;
}

const progress = (alongKm: number, next: TripProgress["next"] = null) =>
  ({ alongKm, next, offRouteKm: 0, remainingKm: 600 - alongKm, arriveMs: 0 }) as TripProgress;

describe("tripNotices", () => {
  it("says nothing early in the trip", () => {
    expect(tripNotices({ plan: plan(), progress: progress(20) })).toEqual([]);
  });

  it("asks for a rest after a long stretch without a stop", () => {
    // 100 km/h plan; 220 km is 132 minutes, past the 120 minute interval.
    const notices = tripNotices({ plan: plan(), progress: progress(220) });
    expect(notices[0]?.kind).toBe("rest");
    expect(notices[0]?.values.hours).toBe("2.2");
  });

  it("points to a stop that is close", () => {
    const next = { stop: stop("Aral", 240), distanceKm: 20, etaMs: 0 };
    const notices = tripNotices({
      plan: plan({ stops: [stop("Aral", 240)] }),
      progress: progress(220, next),
    });
    expect(notices[0]).toMatchObject({
      kind: "restSoon",
      values: { title: "Aral", km: "20" },
    });
  });

  it("counts from the last stop passed", () => {
    const notices = tripNotices({
      plan: plan({ stops: [stop("A", 150)] }),
      progress: progress(220),
    });
    expect(notices).toEqual([]);
  });

  it("warns about harsh weather ahead, once", () => {
    const seg = (km: number, code: number) => ({
      distance_from_start_km: km,
      weather_code: code,
      wind_kmh: 10,
      precipitation_mm: 0,
      summary_bg: "snow",
      place: "Niš",
    });
    const notices = tripNotices({
      plan: plan({
        weather: {
          segments: [seg(50, 0), seg(150, 73), seg(200, 75)],
          warnings: [],
          attribution: "",
        },
      } as unknown as Partial<TripPlannerResult>),
      progress: progress(30),
    });
    const weather = notices.filter((notice) => notice.kind === "weather");
    expect(weather).toHaveLength(1);
    expect(weather[0]?.values).toMatchObject({ place: "Niš", km: "120" });
  });

  it("suggests a cheap fuel stop only when the saving is real", () => {
    const advice = (eur: number) =>
      ({ est_savings_eur: eur }) as PlanStop["advice"];
    const cheap = tripNotices({
      plan: plan({ stops: [stop("Cheap", 80, { advice: advice(3.2) })] }),
      progress: progress(30),
    });
    expect(cheap[0]).toMatchObject({
      kind: "fuel",
      values: { title: "Cheap", km: "50", saving: "3.2" },
    });
    const small = tripNotices({
      plan: plan({ stops: [stop("Meh", 80, { advice: advice(0.4) })] }),
      progress: progress(30),
    });
    expect(small).toEqual([]);
  });
});

describe("isHarshWeather", () => {
  it("flags storms, snow, fog, wind and heavy rain", () => {
    const base = { weather_code: 0, wind_kmh: 0, precipitation_mm: 0 };
    expect(isHarshWeather({ ...base, weather_code: 95 })).toBe(true);
    expect(isHarshWeather({ ...base, weather_code: 73 })).toBe(true);
    expect(isHarshWeather({ ...base, weather_code: 45 })).toBe(true);
    expect(isHarshWeather({ ...base, wind_kmh: 70 })).toBe(true);
    expect(isHarshWeather({ ...base, precipitation_mm: 6 })).toBe(true);
    expect(isHarshWeather({ ...base, weather_code: 3 })).toBe(false);
  });
});

describe("long day", () => {
  // 600 km in 360 min is 100 km/h, so 10 h is 1000 km: use a long route.
  const longPlan = (prefs: { with_children?: boolean; children_ages?: number[] } = {}): TripPlannerResult =>
    plan({
      route: { distance_km: 1500, duration_min: 900 },
      preferences: resolveTripPreferences({ break_every_min: 240, ...prefs }),
    } as Partial<TripPlannerResult>);

  it("warns an hour before 10 hours and at 10 hours", () => {
    expect(tripNotices({ plan: longPlan(), progress: progress(900) }).some((n) => n.kind === "longDaySoon")).toBe(true);
    expect(tripNotices({ plan: longPlan(), progress: progress(1010) }).some((n) => n.kind === "longDay")).toBe(true);
    expect(tripNotices({ plan: longPlan(), progress: progress(500) }).some((n) => n.kind.startsWith("longDay"))).toBe(false);
  });

  it("uses 8 hours with children", () => {
    const kids = longPlan({ with_children: true, children_ages: [8] });
    expect(tripNotices({ plan: kids, progress: progress(820) }).some((n) => n.kind === "longDay")).toBe(true);
  });

  it("counts from the last night stop", () => {
    const withNight = {
      ...longPlan(),
      stops: [stop("n", 900, { kinds: ["overnight"] })],
    } as TripPlannerResult;
    expect(tripNotices({ plan: withNight, progress: progress(1100) }).some((n) => n.kind.startsWith("longDay"))).toBe(false);
  });
});
