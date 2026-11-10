import { describe, expect, it } from "vitest";
import { nearestBgBorder } from "@/lib/geo/border-on-route";

describe("nearest Bulgarian border on a route", () => {
  it("picks Kalotina when the line crosses the Serbian border", () => {
    const hit = nearestBgBorder([
      [22.4, 43.3],
      [22.9, 42.98],
      [23.32, 42.7],
    ]);
    expect(hit?.id).toBe("kalotina");
  });

  it("picks the Ruse bridge on a Danube crossing", () => {
    const hit = nearestBgBorder([
      [26.0, 44.2],
      [25.97, 43.9],
      [25.9, 43.6],
    ]);
    expect(hit?.id).toBe("danube-bridge-ruse");
  });

  it("returns nothing for a route that stays in Germany", () => {
    expect(
      nearestBgBorder([
        [13.3, 52.5],
        [11.5, 48.1],
      ])
    ).toBeNull();
  });

  it("picks Kulata rather than the inland Promahon point on the Struma crossing", () => {
    const hit = nearestBgBorder([
      [23.362, 41.382],
      [22.942, 40.634],
    ]);
    expect(hit?.id).toBe("kulata");
  });
});
