import { describe, expect, it } from "vitest";
import {
  compactRouteForPlanning,
  downsampleLineString,
} from "@/lib/utils/route-geometry";
import type { Route } from "@/types/route.types";

describe("downsampleLineString", () => {
  it("keeps short lines intact", () => {
    const line: Array<[number, number]> = [
      [10, 50],
      [11, 50],
      [12, 50],
    ];
    expect(downsampleLineString(line, 10)).toEqual(line);
  });

  it("preserves start and end on a long line", () => {
    const line = Array.from({ length: 10_000 }, (_, i) => [i / 100, 48] as [number, number]);
    const compact = downsampleLineString(line, 200);
    expect(compact.length).toBe(200);
    expect(compact[0]).toEqual(line[0]);
    expect(compact[compact.length - 1]).toEqual(line[line.length - 1]);
  });
});

describe("compactRouteForPlanning", () => {
  it("drops alternatives and shrinks geometry", () => {
    const route: Route = {
      id: "r",
      origin: { id: "a", label: "A", coords: { lng: 10, lat: 50 } },
      destination: { id: "b", label: "B", coords: { lng: 20, lat: 50 } },
      waypoints: [],
      distance_km: 800,
      duration_min: 500,
      geometry: {
        type: "LineString",
        coordinates: Array.from({ length: 5000 }, (_, i) => [10 + i / 500, 50]),
      },
      alternatives: [
        {
          id: "alt",
          distance_km: 820,
          duration_min: 510,
          geometry: { type: "LineString", coordinates: [[10, 50], [20, 50]] },
          weight: 1,
        },
      ],
    };

    const compact = compactRouteForPlanning(route, 100);
    expect(compact.geometry.coordinates).toHaveLength(100);
    expect(compact.alternatives).toEqual([]);
  });
});
