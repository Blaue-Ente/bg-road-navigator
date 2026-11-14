import { describe, expect, it } from "vitest";
import { decodePolyline } from "@/lib/geo/polyline";

describe("decodePolyline", () => {
  it("decodes the canonical precision-5 polyline", () => {
    const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@", 5);
    expect(points).toHaveLength(3);
    expect(points[0]?.[0]).toBeCloseTo(-120.2, 5);
    expect(points[0]?.[1]).toBeCloseTo(38.5, 5);
    expect(points[2]?.[0]).toBeCloseTo(-126.453, 3);
    expect(points[2]?.[1]).toBeCloseTo(43.252, 3);
  });

  it("round-trips precision 6 as GeoJSON lng/lat", () => {
    const original: Array<[number, number]> = [
      [23.3219, 42.6977],
      [24.7453, 42.1354],
    ];
    const decoded = decodePolyline(encodePolyline(original, 6), 6);
    expect(decoded).toHaveLength(2);
    expect(decoded[0]?.[0]).toBeCloseTo(23.3219, 5);
    expect(decoded[0]?.[1]).toBeCloseTo(42.6977, 5);
    expect(decoded[1]?.[0]).toBeCloseTo(24.7453, 5);
    expect(decoded[1]?.[1]).toBeCloseTo(42.1354, 5);
  });

  it("returns no points for an empty shape", () => {
    expect(decodePolyline("")).toEqual([]);
  });
});

function encodePolyline(
  points: Array<[number, number]>,
  precision: number
): string {
  const factor = 10 ** precision;
  let lastLat = 0;
  let lastLng = 0;
  let encoded = "";
  for (const [lng, lat] of points) {
    const latInt = Math.round(lat * factor);
    const lngInt = Math.round(lng * factor);
    encoded += encodeSigned(latInt - lastLat);
    encoded += encodeSigned(lngInt - lastLng);
    lastLat = latInt;
    lastLng = lngInt;
  }
  return encoded;
}

function encodeSigned(value: number): string {
  let current = value < 0 ? ~(value << 1) : value << 1;
  let output = "";
  while (current >= 0x20) {
    output += String.fromCharCode((0x20 | (current & 0x1f)) + 63);
    current >>= 5;
  }
  output += String.fromCharCode(current + 63);
  return output;
}
