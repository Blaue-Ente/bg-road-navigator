import { describe, expect, it } from "vitest";
import { buildPushSchedule, type TripPushPlan } from "@/lib/push/schedule";

const plan: TripPushPlan = {
  depart_at: "2026-11-17T08:00:00.000Z",
  speed_kmh: 100,
  stops: [
    { id: "a", title: "Aral", kinds: ["fuel"], eta: "2026-11-17T10:00:00.000Z", optional: false, saving_eur: 3.2 },
    { id: "b", title: "View", kinds: ["sight"], eta: "2026-11-17T11:00:00.000Z", optional: true, saving_eur: null },
    { id: "c", title: "Hotel", kinds: ["overnight"], eta: "2026-11-17T18:00:00.000Z", optional: false, saving_eur: null },
  ],
  weather: [
    { eta: "2026-11-17T14:00:00.000Z", weather_code: 73, wind_kmh: 5, precipitation_mm: 0, summary: "Snow", place: "Niš, Serbia" },
    { eta: "2026-11-17T09:00:00.000Z", weather_code: 1, wind_kmh: 5, precipitation_mm: 0, summary: "Clear", place: null },
  ],
};

const now = new Date("2026-11-17T08:00:00.000Z");

describe("border question", () => {
  const withBorder: TripPushPlan = {
    ...plan,
    border: { id: "kalotina", name: "Kalotina", eta: "2026-11-17T12:00:00.000Z", wait_min: 40 },
  };

  it("asks well after the expected crossing and opens the question", () => {
    const rows = buildPushSchedule({ plan: withBorder, startedAt: now, now, locale: "en" });
    const ask = rows.find((row) => row.tag === "border-kalotina");
    expect(ask?.sendAt.toISOString()).toBe("2026-11-17T13:05:00.000Z");
    expect(ask?.body).toContain("Kalotina");
    expect(ask?.url).toBe("/?border=kalotina&wait=40");
  });

  it("follows a late start and is left out when the route has no border", () => {
    const late = buildPushSchedule({
      plan: withBorder,
      startedAt: new Date("2026-11-17T09:00:00.000Z"),
      now,
      locale: "bg",
    });
    expect(late.find((row) => row.tag === "border-kalotina")?.sendAt.toISOString()).toBe(
      "2026-11-17T14:05:00.000Z"
    );
    const none = buildPushSchedule({ plan, startedAt: now, now, locale: "en" });
    expect(none.some((row) => row.tag.startsWith("border-"))).toBe(false);
  });
});

describe("buildPushSchedule", () => {
  const rows = buildPushSchedule({ plan, startedAt: now, now, locale: "en" });

  it("times pushes before stops, weather and fuel savings", () => {
    expect(rows.map((row) => row.tag)).toEqual([
      "fuel-a",
      "stop-a",
      "weather-0",
      "stop-c",
    ]);
    expect(rows[0]?.sendAt.toISOString()).toBe("2026-11-17T09:30:00.000Z");
    expect(rows[1]?.sendAt.toISOString()).toBe("2026-11-17T09:48:00.000Z");
    expect(rows[2]?.sendAt.toISOString()).toBe("2026-11-17T13:15:00.000Z");
  });

  it("skips sights and calm weather, and mentions the saving", () => {
    expect(rows.some((row) => row.tag.includes("b"))).toBe(false);
    expect(rows[0]?.body).toContain("3.2");
    expect(rows[2]?.body).toContain("Niš, Serbia");
  });

  it("shifts by a late start and drops what is already past", () => {
    const late = buildPushSchedule({
      plan,
      startedAt: new Date("2026-11-17T09:00:00.000Z"),
      now: new Date("2026-11-17T10:40:00.000Z"),
      locale: "bg",
    });
    expect(late[0]?.tag).toBe("stop-a");
    expect(late[0]?.sendAt.toISOString()).toBe("2026-11-17T10:48:00.000Z");
  });
});

describe("plan sent from a phone", () => {
  it("accepts weather rows with missing optional numbers", async () => {
    const { TripPushPlanSchema } = await import("@/lib/push/schedule");
    const parsed = TripPushPlanSchema.safeParse({
      ...plan,
      weather: [{ eta: "2026-11-17T14:00:00.000Z", summary: "Clear" }],
    });
    expect(parsed.success).toBe(true);
  });
});

describe("long day nudges", () => {
  it("asks before and at the limit while the plan still has the day going", () => {
    const rows = buildPushSchedule({
      plan: {
        ...plan,
        day_limit_h: 10,
        arrive_at: "2026-11-18T10:00:00.000Z",
        stops: [
          { id: "n", title: "Hotel", kinds: ["overnight"], eta: "2026-11-17T22:00:00.000Z", optional: false, saving_eur: null, sleep_min: 480 },
        ],
      },
      startedAt: now,
      now,
      locale: "en",
    });
    const soon = rows.find((row) => row.tag === "longday-soon-0");
    const limit = rows.find((row) => row.tag === "longday-0");
    // 10 h of driving is about 11.76 h on the clock: limit at 19:45, nudge an hour before.
    expect(limit?.sendAt.toISOString().slice(0, 16)).toBe("2026-11-17T19:45");
    expect(soon?.sendAt.toISOString().slice(0, 16)).toBe("2026-11-17T18:45");
    expect(limit?.body).toContain("10");
  });

  it("stays quiet when the planned night stop comes first", () => {
    const rows = buildPushSchedule({
      plan: {
        ...plan,
        day_limit_h: 10,
        arrive_at: "2026-11-18T10:00:00.000Z",
        stops: [
          { id: "n", title: "Hotel", kinds: ["overnight"], eta: "2026-11-17T16:00:00.000Z", optional: false, saving_eur: null, sleep_min: 480 },
        ],
      },
      startedAt: now,
      now,
      locale: "en",
    });
    expect(rows.some((row) => row.tag === "longday-0")).toBe(false);
  });
});
