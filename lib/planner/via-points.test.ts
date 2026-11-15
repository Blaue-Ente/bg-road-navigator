import { describe, expect, it } from "vitest";
import { routeThroughPoints } from "@/lib/planner/via-points";

const SOFIA = { lng: 23.32, lat: 42.7 };
const NIS = { lng: 21.9, lat: 43.32 };
const BELGRADE = { lng: 20.46, lat: 44.82 };
const BORDER = { lng: 22.9, lat: 43.0 };

describe("routeThroughPoints", () => {
  it("keeps the previous origin, border, destination order when there is no via", () => {
    expect(routeThroughPoints(SOFIA, [], BELGRADE, BORDER)).toEqual([
      { ...SOFIA, role: "break" },
      { ...BORDER, role: "through" },
      { ...BELGRADE, role: "break" },
    ]);
  });

  it("orders a via and a border by progress toward the destination", () => {
    const chain = routeThroughPoints(SOFIA, [NIS], BELGRADE, BORDER);
    expect(chain.map((point) => point.lng)).toEqual([
      SOFIA.lng,
      BORDER.lng,
      NIS.lng,
      BELGRADE.lng,
    ]);
    expect(chain[0]?.role).toBe("break");
    expect(chain[3]?.role).toBe("break");
  });
});
