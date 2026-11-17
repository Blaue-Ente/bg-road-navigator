import { describe, expect, it } from "vitest";
import {
  nextTurn,
  placeManeuvers,
  turnArrow,
} from "@/lib/trip/next-turn";
import type { RouteManeuver } from "@/types/route.types";

const line: Array<[number, number]> = Array.from({ length: 11 }, (_, i) => [
  i * 0.1,
  0,
]);

function maneuver(
  type: string,
  lng: number,
  modifier?: string
): RouteManeuver {
  return {
    instruction_bg: type,
    type,
    modifier,
    distance_m: 0,
    duration_s: 0,
    coords: { lng, lat: 0 },
  };
}

describe("placeManeuvers and nextTurn", () => {
  const turns = placeManeuvers(
    [
      maneuver("depart", 0),
      maneuver("continue", 0.2),
      maneuver("turn", 0.5, "right"),
      maneuver("turn", 0.2, "left"),
      maneuver("arrive", 1),
    ],
    line,
    1
  );

  it("drops quiet maneuvers and sorts by position", () => {
    expect(turns.map((turn) => turn.maneuver.type)).toEqual([
      "turn",
      "turn",
      "arrive",
    ]);
    expect(turns[0]?.maneuver.modifier).toBe("left");
  });

  it("finds the next turn and the distance to it", () => {
    const next = nextTurn(turns, 10);
    expect(next?.turn.maneuver.modifier).toBe("left");
    expect(next?.distanceM).toBeGreaterThan(11_000);
    expect(next?.distanceM).toBeLessThan(12_500);
    expect(nextTurn(turns, 30)?.turn.maneuver.modifier).toBe("right");
  });

  it("has no turn after the last one", () => {
    expect(nextTurn(turns, 200)).toBeNull();
  });
});

describe("turnArrow", () => {
  it("maps types and modifiers", () => {
    expect(turnArrow(maneuver("turn", 0, "sharp left"))).toBe("left");
    expect(turnArrow(maneuver("turn", 0, "slight right"))).toBe("right");
    expect(turnArrow(maneuver("turn", 0, "uturn"))).toBe("uturn");
    expect(turnArrow(maneuver("roundabout", 0))).toBe("roundabout");
    expect(turnArrow(maneuver("arrive", 0))).toBe("arrive");
    expect(turnArrow(maneuver("fork", 0, "straight"))).toBe("straight");
  });
});
