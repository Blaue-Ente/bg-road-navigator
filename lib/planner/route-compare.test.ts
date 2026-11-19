import { describe, expect, it } from "vitest";
import { pointsOver } from "@/lib/planner/route-compare";
import type { RouteOptionSummary } from "@/lib/planner/types";

function option(over: Partial<RouteOptionSummary>): RouteOptionSummary {
  return {
    id: "primary",
    role: "primary",
    source: "border",
    border_id: null,
    label: "x",
    distance_km: 1000,
    drive_min: 600,
    wait_min: 30,
    total_min: 630,
    countries: ["DE", "AT"],
    vignette_codes: ["AT"],
    toll_codes: [],
    geometry: { type: "LineString", coordinates: [] },
    ...over,
  };
}

describe("pointsOver", () => {
  it("lists what is better, and nothing for a tie", () => {
    expect(pointsOver(option({}), option({}))).toEqual([]);
    const better = option({ distance_km: 940, drive_min: 560, total_min: 570, wait_min: 10 });
    const codes = pointsOver(better, option({})).map((p) => p.code);
    expect(codes).toEqual(["shorter_distance", "shorter_total", "shorter_drive", "less_wait"]);
  });

  it("names tolls, vignettes and countries the other road needs", () => {
    const plain = option({ vignette_codes: [], countries: ["DE"] });
    const busy = option({ toll_codes: ["RS"], countries: ["DE", "RS"], vignette_codes: ["HU"] });
    const out = pointsOver(plain, busy);
    expect(out.find((p) => p.code === "fewer_tolls")?.codes).toEqual(["RS"]);
    expect(out.find((p) => p.code === "fewer_vignettes")?.codes).toEqual(["HU"]);
    expect(out.find((p) => p.code === "avoids_countries")?.codes).toEqual(["RS"]);
  });
});
