import { describe, expect, it } from "vitest";
import {
  scoreBorderOptions,
  selectCandidateBorders,
} from "@/lib/planner/borders";
import type { WaitEstimate } from "@/lib/planner/types";
import { NAKORDONI_ATTRIBUTION } from "@/lib/planner/wait";

const sofia = { lng: 23.3219, lat: 42.6977 };
const munich = { lng: 11.582, lat: 48.1351 };
const istanbul = { lng: 28.9784, lat: 41.0082 };

function wait(minutes: number): WaitEstimate {
  return {
    source: "current",
    estimate: true,
    minutes,
    metric: "wait_min",
    quality: "high",
    queue_now: minutes,
    observed_at: "2026-11-14T12:00:00.000Z",
    age_min: 20,
    age_label: "наблюдение преди 20 мин",
    label_bg: "текуща опашка от кеша",
    attribution: NAKORDONI_ATTRIBUTION,
  };
}

describe("selectCandidateBorders", () => {
  it("keeps Kalotina toward Munich and drops the Turkish crossings", () => {
    const ids = selectCandidateBorders({
      origin: sofia,
      destination: munich,
      originCountry: "BG",
      destinationCountry: "DE",
    }).map((border) => border.id);

    expect(ids).toContain("kalotina");
    expect(ids).not.toContain("kapitan-andreevo");
    expect(ids).not.toContain("lesovo");
    expect(ids).not.toContain("kulata");
    expect(ids.length).toBeLessThanOrEqual(4);
  });

  it("keeps Kapitan Andreevo toward Istanbul and drops Kalotina", () => {
    const ids = selectCandidateBorders({
      origin: sofia,
      destination: istanbul,
      originCountry: "BG",
      destinationCountry: "TR",
    }).map((border) => border.id);

    expect(ids).toContain("kapitan-andreevo");
    expect(ids).not.toContain("kalotina");
  });

  it("does not force a border when both ends are in the same country", () => {
    expect(
      selectCandidateBorders({
        origin: sofia,
        destination: { lng: 27.46, lat: 42.5 },
        originCountry: "BG",
        destinationCountry: "BG",
      })
    ).toEqual([]);
  });
});

describe("scoreBorderOptions", () => {
  it("picks the lowest total of driving, wait and community penalty", () => {
    const scored = scoreBorderOptions([
      {
        borderId: "vidin",
        nameBg: "Видин",
        nameEn: "Vidin",
        coords: { lng: 22.88, lat: 43.99 },
        ppid: "id_289",
        driveMin: 760,
        distanceKm: 1100,
        wait: wait(90),
        communityPenaltyMin: 10,
      },
      {
        borderId: "kalotina",
        nameBg: "Калотина",
        nameEn: "Kalotina",
        coords: { lng: 22.9, lat: 42.98 },
        ppid: "id_390",
        driveMin: 800,
        distanceKm: 1050,
        wait: wait(25),
        communityPenaltyMin: 0,
      },
    ]);

    expect(scored[0]).toMatchObject({
      borderId: "kalotina",
      chosen: true,
      reasonCode: "lowest_total",
      totalMin: 825,
    });
    expect(scored[0]?.reason).toContain("Калотина");
    expect(scored[1]).toMatchObject({
      borderId: "vidin",
      chosen: false,
      reasonCode: "slower_than_best",
      totalMin: 860,
    });
    expect(scored[1]?.reason).toContain("35 мин повече");
  });
});
