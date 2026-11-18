import { describe, expect, it } from "vitest";
import { projectOnLine, samplePoints } from "@/lib/sights/geometry";

const line: Array<[number, number]> = [
  [10, 50],
  [11, 50],
  [12, 50],
];

describe("projectOnLine", () => {
  it("measures the distance off the road and the position along it", () => {
    const here = projectOnLine(line, { lng: 11, lat: 50.09 }, 143);
    expect(here).not.toBeNull();
    expect(here!.offKm).toBeGreaterThan(9);
    expect(here!.offKm).toBeLessThan(11);
    expect(here!.alongKm).toBeGreaterThan(65);
    expect(here!.alongKm).toBeLessThan(78);
  });

  it("is null for a line with fewer than two points", () => {
    expect(projectOnLine([[10, 50]], { lng: 10, lat: 50 }, 10)).toBeNull();
  });
});

describe("samplePoints", () => {
  it("spreads points away from the ends", () => {
    const points = samplePoints(line, 3);
    expect(points).toHaveLength(3);
    expect(points[0]!.share).toBeCloseTo(0.25, 2);
    expect(points[2]!.share).toBeCloseTo(0.75, 2);
  });
});
