import { describe, expect, it } from "vitest";
import {
  rescoreBordersAfterWaitUpdate,
  type BorderScoreInput,
  scoreBorderOptions,
} from "@/lib/planner/borders";
import { expectedWait, localTypicalMinutes } from "@/lib/planner/wait";

const KALOTINA_TABLE = Array.from({ length: 24 }, (_, hour) =>
  hour === 7 ? 25 : hour === 10 ? 20 : 15
);

describe("border wait consistency after sleep refresh", () => {
  it("rebuilds chosen reason so card, reason, and wait share one number", () => {
    const now = new Date("2026-11-16T04:00:00.000Z");
    const preEta = new Date("2026-11-16T05:00:00.000Z");
    const postEta = new Date("2026-11-16T08:00:00.000Z");
    expect(localTypicalMinutes(KALOTINA_TABLE, preEta)).toBe(25);
    expect(localTypicalMinutes(KALOTINA_TABLE, postEta)).toBe(20);

    const preWait = expectedWait({
      eta: preEta,
      now,
      forecast: null,
      dayStats: null,
      current: null,
      localTypical: KALOTINA_TABLE,
      licensed: true,
      locale: "bg",
    });
    const postWait = expectedWait({
      eta: postEta,
      now,
      forecast: null,
      dayStats: null,
      current: null,
      localTypical: KALOTINA_TABLE,
      licensed: true,
      locale: "bg",
    });
    expect(preWait.minutes).toBe(25);
    expect(postWait.minutes).toBe(20);

    const input: BorderScoreInput = {
      borderId: "kalotina",
      nameBg: "Калотина",
      nameEn: "Kalotina",
      coords: { lng: 22.8969, lat: 42.9833 },
      ppid: "id_390",
      driveMin: 600,
      distanceKm: 900,
      wait: preWait,
      communityPenaltyMin: 0,
    };
    const scored = scoreBorderOptions([input], "bg");
    expect(scored[0]!.reason).toContain("25");

    const refreshed = rescoreBordersAfterWaitUpdate(
      scored.map((border) =>
        border.borderId === "kalotina"
          ? {
              ...border,
              wait: postWait,
            }
          : border
      ),
      "bg"
    );
    const chosen = refreshed.find((row) => row.chosen)!;
    expect(chosen.wait.minutes).toBe(20);
    expect(chosen.reason).toContain("20");
    expect(chosen.reason).not.toMatch(/\b25\b/);
    expect(chosen.totalMin).toBe(600 + 20);
  });
});