import { describe, expect, it } from "vitest";
import { getCityById } from "@/lib/constants/european-cities";
import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import { getRouteTolls } from "@/lib/utils/route-tolls";
import type { GeoPoint } from "@/types/route.types";

function city(id: string): GeoPoint {
  const found = getCityById(id);
  if (!found) throw new Error(`missing city ${id}`);
  return found.coords;
}

function routeThrough(points: GeoPoint[]) {
  return {
    geometry: {
      type: "LineString" as const,
      coordinates: points.map((point) => [point.lng, point.lat]),
    },
    origin: { coords: points[0]! },
    destination: { coords: points[points.length - 1]! },
  };
}

describe("getRouteTolls", () => {
  it("classifies inland cities used by the planner", () => {
    expect(countryCodeAtPoint(23.3219, 42.6977)).toBe("BG");
    expect(countryCodeAtPoint(20.4489, 44.7866)).toBe("RS");
    expect(countryCodeAtPoint(19.0402, 47.4979)).toBe("HU");
    expect(countryCodeAtPoint(15.9819, 45.815)).toBe("HR");
    expect(countryCodeAtPoint(28.9784, 41.0082)).toBe("TR");
  });

  it("returns only the vignette for a trip inside Bulgaria", () => {
    const tolls = getRouteTolls(routeThrough([city("sofia"), city("plovdiv")]));
    expect(tolls.map((toll) => toll.country_code)).toEqual(["BG"]);
    expect(tolls[0]?.kind).toBe("vignette");
  });

  it("follows the route into Serbia and Hungary, toll before vignette", () => {
    const tolls = getRouteTolls(
      routeThrough([
        city("sofia"),
        city("nis"),
        city("belgrade"),
        city("budapest"),
      ])
    );
    expect(tolls.map((toll) => [toll.country_code, toll.kind])).toEqual([
      ["BG", "vignette"],
      ["RS", "distance_toll"],
      ["HU", "vignette"],
    ]);
  });

  it("adds Croatia and Slovenia only when the line crosses them", () => {
    const tolls = getRouteTolls(
      routeThrough([city("zagreb"), city("ljubljana")])
    );
    expect(tolls.map((toll) => toll.country_code)).toEqual(["HR", "SI"]);
    expect(tolls[0]?.kind).toBe("distance_toll");
    expect(tolls[1]?.kind).toBe("vignette");
  });

  it("includes the Turkish HGS toll on the way to Istanbul", () => {
    const tolls = getRouteTolls(
      routeThrough([city("sofia"), city("istanbul")])
    );
    expect(tolls.map((toll) => toll.country_code)).toEqual(["BG", "TR"]);
    expect(tolls[1]?.kind).toBe("distance_toll");
    expect(tolls[1]?.official_url).toContain("hgsmusteri.ptt.gov.tr");
  });

  it("skips countries that have no vignette or distance toll in the catalog", () => {
    const tolls = getRouteTolls(
      routeThrough([city("munich"), city("frankfurt")])
    );
    expect(tolls).toEqual([]);
  });

  it("uses maneuver locations when the geometry is missing", () => {
    const tolls = getRouteTolls({
      maneuvers: [{ coords: city("sofia") }, { coords: city("bucharest") }],
    });
    expect(tolls.map((toll) => toll.country_code)).toEqual(["BG", "RO"]);
    expect(tolls[1]?.official_url).toBe("https://etoll.ro");
  });

  it("prefers the road geometry over maneuver points in another country", () => {
    const tolls = getRouteTolls({
      geometry: {
        type: "LineString",
        coordinates: [
          [city("sofia").lng, city("sofia").lat],
          [city("plovdiv").lng, city("plovdiv").lat],
        ],
      },
      maneuvers: [{ coords: city("vienna") }, { coords: city("munich") }],
    });
    expect(tolls.map((toll) => toll.country_code)).toEqual(["BG"]);
  });
});
