import { describe, expect, it } from "vitest";
import {
  nearestHungarySerbiaCrossing,
  scoreBorderOptions,
  selectCandidateBorders,
  selectHungarySerbiaBorders,
  tripMayCrossHungarySerbia,
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

  it("offers the Serbia–Hungary posts when that frontier is the choice", () => {
    const belgrade = { lng: 20.46, lat: 44.79 };
    const budapest = { lng: 19.04, lat: 47.5 };
    const ids = selectHungarySerbiaBorders({
      origin: belgrade,
      destination: budapest,
      originCountry: "RS",
      destinationCountry: "HU",
    }).map((border) => border.id);

    expect(ids).toContain("horgos");
    expect(ids).toContain("tompa");
    expect(ids).toContain("hercegszanto");
    expect(ids).not.toContain("kalotina");
    expect(ids).not.toContain("asotthalom");
  });

  it("picks the motorway when the driven line passes through Horgoš", () => {
    expect(
      nearestHungarySerbiaCrossing([
        [19.978, 44.8],
        [19.978, 46.183],
        [19.978, 47.5],
      ])?.id
    ).toBe("horgos");
    expect(
      nearestHungarySerbiaCrossing([
        [23.32, 42.7],
        [24.75, 42.14],
      ])
    ).toBeNull();
  });

  it("does not ask for Hárinfó on a trip that stays south of the frontier", () => {
    expect(
      tripMayCrossHungarySerbia({
        origin: sofia,
        destination: { lng: 24.75, lat: 42.14 },
        originCountry: "BG",
        destinationCountry: "BG",
      })
    ).toBe(false);
    expect(
      tripMayCrossHungarySerbia({
        origin: sofia,
        destination: munich,
        originCountry: "BG",
        destinationCountry: "DE",
      })
    ).toBe(true);
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
