import { describe, expect, it } from "vitest";
import { maneuverInstructionBg, stepsToManeuvers } from "@/lib/utils/maneuvers";

describe("maneuvers", () => {
  it("builds a Bulgarian instruction", () => {
    expect(
      maneuverInstructionBg({
        name: "A1",
        maneuver: { type: "turn", modifier: "right" },
      })
    ).toContain("надясно");
  });

  it("skips steps without a location", () => {
    expect(stepsToManeuvers([{ name: "x" }])).toEqual([]);
  });

  it("maps located steps", () => {
    const list = stepsToManeuvers([
      {
        name: "E80",
        distance: 1200,
        duration: 60,
        maneuver: { type: "continue", location: [23.3, 42.7] },
      },
    ]);
    expect(list).toHaveLength(1);
    expect(list[0]?.coords).toEqual({ lng: 23.3, lat: 42.7 });
  });
});
