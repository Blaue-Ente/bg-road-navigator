import { describe, expect, it } from "vitest";
import { getRouteTolls } from "@/lib/utils/route-tolls";
import {
  buildValhallaRouteBody,
  mapValhallaResponse,
} from "@/lib/api-clients/valhalla";

const SOFIA: [number, number] = [23.3219, 42.6977];
const PLOVDIV: [number, number] = [24.7453, 42.1354];

describe("mapValhallaResponse", () => {
  it("maps polyline6, summary, maneuvers, and alternates into a road route", () => {
    const route = mapValhallaResponse({
      trip: tripBetween(SOFIA, PLOVDIV, {
        length: 142.4,
        time: 9_000,
        maneuver: {
          type: 10,
          street_names: ["бул. Цариградско шосе"],
          length: 12.5,
          time: 600,
          begin_shape_index: 0,
        },
      }),
      alternates: [
        {
          trip: tripBetween(SOFIA, [25.1, 42.4], {
            length: 160.2,
            time: 9_600,
          }),
        },
      ],
    });

    expect(route).not.toBeNull();
    expect(route?.distance_km).toBe(142);
    expect(route?.duration_min).toBe(150);
    expect(route?.geometry.type).toBe("LineString");
    expect(route?.geometry.coordinates[0]?.[0]).toBeCloseTo(SOFIA[0], 4);
    expect(route?.geometry.coordinates[0]?.[1]).toBeCloseTo(SOFIA[1], 4);
    expect(route?.geometry.coordinates.at(-1)?.[0]).toBeCloseTo(PLOVDIV[0], 4);
    expect(route?.maneuvers[0]?.instruction_bg).toContain("надясно");
    expect(route?.maneuvers[0]?.instruction_bg).toContain("Цариградско шосе");
    expect(route?.maneuvers[0]?.distance_m).toBe(12_500);
    expect(route?.maneuvers[0]?.coords).toEqual({
      lng: expect.closeTo(SOFIA[0], 4),
      lat: expect.closeTo(SOFIA[1], 4),
    });
    expect(route?.alternatives).toHaveLength(1);
    expect(route?.alternatives[0]?.distance_km).toBe(160);
    expect(route?.alternatives[0]?.duration_min).toBe(160);
  });

  it("keeps the mapped geometry usable for vignette detection", () => {
    const route = mapValhallaResponse({
      trip: tripBetween(SOFIA, PLOVDIV, { length: 140, time: 7_200 }),
    });
    expect(route).not.toBeNull();
    const tolls = getRouteTolls({
      geometry: route!.geometry,
      origin: { coords: { lng: SOFIA[0], lat: SOFIA[1] } },
      destination: { coords: { lng: PLOVDIV[0], lat: PLOVDIV[1] } },
    });
    expect(tolls.map((toll) => toll.country_code)).toContain("BG");
  });

  it("converts mile summaries and drops a failed trip", () => {
    const miles = mapValhallaResponse({
      trip: tripBetween(SOFIA, PLOVDIV, {
        length: 10,
        time: 600,
        units: "miles",
      }),
    });
    expect(miles?.distance_km).toBe(16);

    expect(mapValhallaResponse({ trip: { status: 442, legs: [] } })).toBeNull();
    expect(mapValhallaResponse({ trip: { status: 0, legs: [] } })).toBeNull();
  });
});

describe("buildValhallaRouteBody", () => {
  it("asks for auto costing and alternates only on a two-point trip", () => {
    const direct = buildValhallaRouteBody([
      { lng: SOFIA[0], lat: SOFIA[1] },
      { lng: PLOVDIV[0], lat: PLOVDIV[1] },
    ]);
    expect(direct.costing).toBe("auto");
    expect(direct.units).toBe("kilometers");
    expect(direct.language).toBe("bg-BG");
    expect(direct.alternates).toBe(2);

    const via = buildValhallaRouteBody([
      { lng: SOFIA[0], lat: SOFIA[1] },
      { lng: 24.1, lat: 42.4 },
      { lng: PLOVDIV[0], lat: PLOVDIV[1] },
    ]);
    expect(via.alternates).toBeUndefined();
    expect(via.locations).toHaveLength(3);
  });
});

function tripBetween(
  start: [number, number],
  end: [number, number],
  options: {
    length: number;
    time: number;
    units?: string;
    maneuver?: {
      type: number;
      street_names?: string[];
      length: number;
      time: number;
      begin_shape_index: number;
    };
  }
) {
  return {
    status: 0,
    units: options.units ?? "kilometers",
    summary: { length: options.length, time: options.time },
    legs: [
      {
        shape: encodePolyline([start, end], 6),
        summary: { length: options.length, time: options.time },
        maneuvers: options.maneuver ? [options.maneuver] : [],
      },
    ],
  };
}

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
