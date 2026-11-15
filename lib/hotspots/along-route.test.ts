import { describe, expect, it } from "vitest";
import { hotspotsAlongRoute } from "@/lib/hotspots/along-route";
import type { Hotspot } from "@/lib/hotspots/types";

function hotspot(lng: number, lat: number, id = "h"): Hotspot {
  return {
    id,
    country: "HU",
    lng,
    lat,
    count: 4,
    fatal: 0,
    serious: 1,
    slight: 3,
    severity: 5,
    year_from: 2021,
    year_to: 2024,
    source_id: "hu-ksh",
  };
}

const line: Array<[number, number]> = [
  [19.0, 47.5],
  [19.1, 47.5],
  [19.5, 47.5],
];

describe("hotspots on a route", () => {
  it("keeps a cluster on the line and drops one beside it", () => {
    const onLine = hotspot(19.1, 47.502, "near");
    const aside = hotspot(19.1, 47.53, "far");
    const matched = hotspotsAlongRoute([aside, onLine], line);
    expect(matched.map((item) => item.id)).toEqual(["near"]);
  });

  it("returns nothing for an empty line", () => {
    expect(hotspotsAlongRoute([hotspot(19.1, 47.5)], [])).toEqual([]);
  });
});
