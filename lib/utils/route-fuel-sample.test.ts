import { describe, expect, it } from "vitest";
import {
  bboxFromCoordinates,
  sampleRouteCoordinates,
} from "@/lib/utils/route-fuel-sample";

describe("route fuel sampling", () => {
  it("builds a bbox", () => {
    expect(
      bboxFromCoordinates([
        [23, 42],
        [16, 48],
      ])
    ).toEqual({ w: 16, s: 42, e: 23, n: 48 });
  });

  it("samples along a long line with a cap", () => {
    // Rough Sofia → Vienna-ish diagonal (~1000+ km when densely sampled)
    const coords: Array<[number, number]> = [];
    for (let i = 0; i <= 40; i++) {
      coords.push([23.3 - i * 0.18, 42.7 + i * 0.14]);
    }
    const samples = sampleRouteCoordinates(coords, 120, 6);
    expect(samples.length).toBeGreaterThanOrEqual(2);
    expect(samples.length).toBeLessThanOrEqual(6);
    expect(samples[0]!.lng).toBeCloseTo(23.3, 1);
  });
});
