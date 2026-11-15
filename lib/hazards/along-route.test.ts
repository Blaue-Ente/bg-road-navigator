import { describe, expect, it } from "vitest";
import { hazardsAlongRoute } from "@/lib/hazards/along-route";
import { hazardReason } from "@/lib/hazards/present";
import type { RoadHazard } from "@/lib/hazards/types";

const SOFIA: [number, number] = [23.3219, 42.6977];
const PLOVDIV: [number, number] = [24.7453, 42.1354];
const MUNICH: [number, number] = [11.582, 48.1351];

function hazard(id: string, lng: number, lat: number): RoadHazard {
  return {
    id,
    kind: "roadworks",
    label_bg: "Ремонт",
    text_bg: "Ремонт",
    road_km_bg: "АМ Тракия, км 45",
    valid_until: null,
    lng,
    lat,
  };
}

describe("hazards along the Bulgarian part of a route", () => {
  const line: Array<[number, number]> = [SOFIA, PLOVDIV, MUNICH];

  it("keeps a point on the Bulgarian chord and one within about 300 m", () => {
    const matched = hazardsAlongRoute(
      [
        hazard("on-sofia", SOFIA[0], SOFIA[1]),
        hazard("near", SOFIA[0], SOFIA[1] + 0.0015),
        hazard("off", SOFIA[0], SOFIA[1] + 0.01),
        hazard("munich", MUNICH[0], MUNICH[1]),
      ],
      line
    );
    expect(matched.map((item) => item.id)).toEqual(["on-sofia", "near"]);
  });

  it("matches nothing when the route never enters Bulgaria", () => {
    const abroad: Array<[number, number]> = [MUNICH, [16.3738, 48.2082]];
    expect(
      hazardsAlongRoute([hazard("on-sofia", SOFIA[0], SOFIA[1])], abroad)
    ).toEqual([]);
  });

  it("adds a why-this-route line only when a hazard is on the route", () => {
    expect(hazardReason([])).toBeNull();
    const reason = hazardReason([hazard("on-sofia", SOFIA[0], SOFIA[1])]);
    expect(reason?.code).toBe("road_hazard");
    expect(reason?.detail).toContain("Ремонт");
    expect(reason?.detail).toContain("АМ Тракия, км 45");
  });
});
