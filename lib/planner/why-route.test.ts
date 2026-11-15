import { describe, expect, it } from "vitest";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import { whyThisRoute } from "@/lib/planner/why-route";

describe("whyThisRoute", () => {
  it("compares the border wait and names an avoided incident", () => {
    const reasons = whyThisRoute({
      borders: [
        {
          chosen: true,
          nameBg: "Калотина",
          totalMin: 200,
          waitMinutes: 20,
          driveMin: 180,
          distanceKm: 320,
        },
        {
          chosen: false,
          nameBg: "Стрезимировци",
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
    expect(
      reasons.filter((reason) => reason.code === "preference").map((r) => r.title)
    ).toEqual(
      expect.arrayContaining(["Без тол и винетки, доколкото може", "Двама шофьори"])
    );
  });
});
