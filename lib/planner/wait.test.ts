import { describe, expect, it } from "vitest";
import {
  parseDayStats,
  parseForecast,
  parseMultiQueues,
} from "@/lib/nakordoni/parse";
import { expectedWait } from "@/lib/planner/wait";

describe("Nakordoni parsers and wait fallback", () => {
  it("reads a multi object keyed by ppid", () => {
    const rows = parseMultiQueues({
      ok: true,
      data: {
        id_390: {
          queue: {
            found: true,
            queue_now: 12,
            wait_min: 25,
            data_quality: "high",
            updated_at: "2026-11-14T10:00:00Z",
          },
          update_info: { age_minutes: 18, datetime: "2026-11-14T10:00:00Z" },
        },
      },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      ppid: "id_390",
      waitMin: 25,
      queueNow: 12,
      ageMin: 18,
    });
  });

  it("prefers the forecast hour over day-stats and the current queue", () => {
    const eta = new Date("2026-11-14T15:10:00.000Z");
    const matrix = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 40)
    );
    const wait = expectedWait({
      eta,
      now: eta,
      forecast: [
        { at: "2026-11-14T15:00:00.000Z", hour: 15, waitMin: 12, queue: 4 },
      ],
      dayStats: {
        timeZone: "Europe/Sofia",
        matrix,
        quality: "high",
        generatedAt: null,
      },
      current: {
        waitMin: 50,
        queueNow: 20,
        quality: "high",
        observedAt: null,
        ageMin: 10,
      },
      localTypical: Array(24).fill(8),
    });
    expect(wait.source).toBe("forecast");
    expect(wait.minutes).toBe(12);
    expect(wait.attribution?.text).toBe("Data by nakordoni.eu");
  });

  it("uses the Monday hour from day-stats when there is no forecast", () => {
    const matrix = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0)
    );
    matrix[0]![9] = 33;
    const parsed = parseDayStats({
      ok: true,
      data: {
        tz: "Europe/Sofia",
        matrix,
        data_quality: "low",
        generated_at: 1_700_000_000,
      },
    });
    const wait = expectedWait({
      eta: new Date("2026-11-16T07:30:00.000Z"),
      now: new Date("2026-11-16T07:30:00.000Z"),
      forecast: parseForecast({ ok: true, data: [] }),
      dayStats: parsed,
      current: null,
      localTypical: Array(24).fill(5),
      timeZone: "Europe/Sofia",
    });
    expect(parsed?.matrix[0]?.[9]).toBe(33);
    expect(wait.source).toBe("day_stats");
    expect(wait.metric).toBe("typical_queue");
    expect(wait.minutes).toBe(33);
    expect(wait.quality).toBe("low");
  });

  it("uses the local typical table for an unlicensed market and keeps the TomTom delay beside it", () => {
    const wait = expectedWait({
      eta: new Date("2026-11-15T08:00:00.000Z"),
      now: new Date("2026-11-15T08:00:00.000Z"),
      forecast: [
        { at: "2026-11-15T08:00:00.000Z", hour: 10, waitMin: 3, queue: 1 },
      ],
      dayStats: null,
      current: {
        waitMin: 40,
        queueNow: 10,
        quality: "high",
        observedAt: null,
        ageMin: 5,
      },
      localTypical: Array(24).fill(18),
      licensed: false,
      trafficDelayMin: 11,
    });
    expect(wait.source).toBe("local_typical");
    expect(wait.minutes).toBe(18);
    expect(wait.unlicensed_market).toBe(true);
    expect(wait.traffic_delay_min).toBe(11);
    expect(wait.attribution).toBeNull();
    expect(wait.label_bg).toContain("Nakordoni");
    expect(parseDayStats({ ok: false, negative: true, status: 403 })).toBeNull();
    expect(parseForecast({ ok: false, negative: true, status: 404 })).toEqual([]);
  });
});
