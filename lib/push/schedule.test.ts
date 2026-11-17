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
