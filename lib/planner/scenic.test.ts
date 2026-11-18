import { describe, expect, it } from "vitest";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";
import { chooseScenicRoute } from "@/lib/planner/scenic";

function route(km: number, min: number, tag = "fast"): ProvidedRoadRoute {
  return {
    provider: "valhalla",
    distance_km: km,
    duration_min: min,
    geometry: { type: "LineString", coordinates: [[tag === "fast" ? 0 : 1, 0], [2, 2]] },
    maneuvers: [],
    alternatives: [],
  };
}

describe("chooseScenicRoute", () => {
  it("uses the scenic road when it is a little longer", () => {
    const out = chooseScenicRoute(route(1000, 600), route(1060, 660, "scenic"))!;
    expect(out.scenic).toMatchObject({ applied: true, reason: "applied", extra_km: 60, extra_min: 60 });
    expect(out.geometry.coordinates[0]![0]).toBe(1);
  });

  it("keeps the fast road when the scenic one is over 25% longer", () => {
    const out = chooseScenicRoute(route(1000, 600), route(1300, 800, "scenic"))!;
    expect(out.scenic).toMatchObject({ applied: false, reason: "too_long", extra_min: 200 });
    expect(out.geometry.coordinates[0]![0]).toBe(0);
  });

  it("keeps the fast road when the scenic one adds more than two hours", () => {
    const out = chooseScenicRoute(route(3000, 2000), route(3300, 2150, "scenic"))!;
    expect(out.scenic?.reason).toBe("too_long");
  });

  it("says so when the two roads are the same", () => {
    const out = chooseScenicRoute(route(1000, 600), route(1002, 602, "scenic"))!;
    expect(out.scenic).toMatchObject({ applied: false, reason: "same" });
  });

  it("says the scenic road was not available", () => {
    const out = chooseScenicRoute(route(1000, 600), null)!;
    expect(out.scenic).toMatchObject({ applied: false, reason: "unsupported", extra_km: null });
    expect(chooseScenicRoute(null, null)).toBeNull();
  });
});
