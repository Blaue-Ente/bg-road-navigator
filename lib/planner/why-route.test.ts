import { describe, expect, it } from "vitest";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import { whyThisRoute } from "@/lib/planner/why-route";

describe("whyThisRoute", () => {
  it("compares the border wait and names an avoided incident", () => {
    const reasons = whyThisRoute({
      borders: [
        {
          chosen: true,
          borderId: "kalotina",
          nameBg: "Калотина",
          nameEn: "Kalotina",
          totalMin: 200,
          waitMinutes: 20,
          driveMin: 180,
          distanceKm: 320,
        },
        {
          chosen: false,
          borderId: "gyueshevo",
          nameBg: "Гюешево",
          nameEn: "Gyueshevo",
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
      incidents: [{ title: "Затворена лента при Сливница", penaltyMin: 8 }],
      preferences: {
        ...DEFAULT_TRIP_PREFERENCES,
        avoid_tolls: true,
        drivers: 2,
      },
    });
    const border = reasons.find((reason) => reason.code === "border_wait");
    expect(border?.delta_min).toBe(60);
    expect(border?.detail).toContain("Калотина");
    expect(border?.detail).toMatch(/По-кратко чакане на границата/);
    expect(border?.detail).not.toMatch(/срещу/);
    expect(reasons.some((reason) => reason.code === "incident")).toBe(true);
    expect(reasons.some((reason) => reason.code === "time_delta")).toBe(true);
    const prefs = reasons.filter((reason) => reason.code === "preference");
    expect(prefs.map((r) => r.title)).toEqual(
      expect.arrayContaining(["Без тол и винетки, доколкото може", "Двама шофьори"])
    );
    expect(prefs.find((r) => r.title === "Двама шофьори")?.detail).toMatch(
      /караме до \d+ ч на ден/
    );
  });

  it("does not add twoDriversDay when only one driver", () => {
    const reasons = whyThisRoute({
      borders: [],
      directDurationMin: 200,
      directDistanceKm: 300,
      chosenDurationMin: 200,
      chosenDistanceKm: 300,
      incidents: [],
      preferences: { ...DEFAULT_TRIP_PREFERENCES, drivers: 1 },
    });
    expect(
      reasons.some(
        (reason) =>
          reason.code === "preference" && reason.detail.includes("водачи")
      )
    ).toBe(false);
  });
});
