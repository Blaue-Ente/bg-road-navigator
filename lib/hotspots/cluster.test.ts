import { describe, expect, it } from "vitest";
import { clusterAccidents } from "@/lib/hotspots/cluster";
import type { AccidentPoint } from "@/lib/hotspots/types";

function point(
  lng: number,
  lat: number,
  kind: AccidentPoint["kind"] = "slight",
  year = 2024
): AccidentPoint {
  return { lng, lat, year, kind, country: "RS", source_id: "rs-mup" };
}

describe("accident clusters", () => {
  it("merges three injury accidents inside 400 m", () => {
    const hotspots = clusterAccidents([
      point(20.45, 44.8),
      point(20.451, 44.801),
      point(20.452, 44.8005, "fatal", 2022),
    ]);
    expect(hotspots).toHaveLength(1);
    expect(hotspots[0]).toMatchObject({
      count: 3,
      fatal: 1,
      slight: 2,
      severity: 5,
      year_from: 2022,
      year_to: 2024,
      country: "RS",
      source_id: "rs-mup",
    });
  });

  it("drops a pair that never reaches the minimum", () => {
    expect(
      clusterAccidents([point(20.45, 44.8), point(20.451, 44.801)])
    ).toEqual([]);
  });

  it("keeps a distant group separate and drops a lone point", () => {
    const hotspots = clusterAccidents([
      point(20.45, 44.8),
      point(20.451, 44.8),
      point(20.452, 44.801),
      point(20.48, 44.8),
    ]);
    expect(hotspots).toHaveLength(1);
    expect(hotspots[0]?.count).toBe(3);
  });
});
