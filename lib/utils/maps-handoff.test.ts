import { describe, expect, it } from "vitest";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
  mapsHandoffUrls,
  sampleHandoffWaypoints,
  wazeDirectionsUrl,
} from "@/lib/utils/maps-handoff";

const origin = { lng: 23.32, lat: 42.7 };
const destination = { lng: 16.37, lat: 48.21 };

describe("maps handoff URLs", () => {
  it("builds a Google Maps directions link that starts navigation", () => {
    const url = googleMapsDirectionsUrl(origin, destination);
    expect(url).toContain("https://www.google.com/maps/dir/?");
    expect(url).toContain("origin=42.7%2C23.32");
    expect(url).toContain("destination=48.21%2C16.37");
    expect(url).toContain("travelmode=driving");
    expect(url).toContain("dir_action=navigate");
  });

  it("passes sampled via points so Google follows the planned corridor", () => {
    const url = googleMapsDirectionsUrl(origin, destination, [
      { lng: 21.0, lat: 45.0 },
      { lng: 19.0, lat: 47.0 },
    ]);
    expect(url).toContain("waypoints=45%2C21%7C47%2C19");
  });

  it("builds an Apple Maps directions link", () => {
    const url = appleMapsDirectionsUrl(origin, destination);
    expect(url).toContain("https://maps.apple.com/?");
    expect(url).toContain("saddr=42.7%2C23.32");
    expect(url).toContain("daddr=48.21%2C16.37");
    expect(url).toContain("dirflg=d");
  });

  it("chains Apple Maps via points before the destination", () => {
    const url = appleMapsDirectionsUrl(origin, destination, [
      { lng: 21.0, lat: 45.0 },
    ]);
    expect(url).toContain("daddr=45%2C21");
    expect(url).toContain("daddr=48.21%2C16.37");
  });

  it("builds a Waze link from origin to destination", () => {
    const url = wazeDirectionsUrl(origin, destination);
    expect(url).toContain("https://www.waze.com/ul?");
    expect(url).toContain("ll=48.21%2C16.37");
    expect(url).toContain("from=42.7%2C23.32");
    expect(url).toContain("navigate=yes");
  });
});

describe("sampleHandoffWaypoints", () => {
  it("returns nothing for a short line", () => {
    expect(
      sampleHandoffWaypoints({
        type: "LineString",
        coordinates: [
          [23.32, 42.7],
          [16.37, 48.21],
        ],
      })
    ).toEqual([]);
  });

  it("keeps inner vertices and drops duplicates", () => {
    const waypoints = sampleHandoffWaypoints({
      type: "LineString",
      coordinates: [
        [23, 42],
        [22, 44],
        [22, 44],
        [20, 46],
        [16, 48],
      ],
    });
    expect(waypoints).toEqual([
      { lng: 22, lat: 44 },
      { lng: 20, lat: 46 },
    ]);
  });

  it("evenly samples a long geometry", () => {
    const coordinates = Array.from({ length: 100 }, (_, index) => [
      23 - index * 0.05,
      42 + index * 0.05,
    ]);
    const waypoints = sampleHandoffWaypoints(
      { type: "LineString", coordinates },
      8
    );
    expect(waypoints).toHaveLength(8);
    expect(waypoints[0]?.lng).not.toBe(coordinates[0]![0]);
    expect(waypoints[waypoints.length - 1]?.lng).not.toBe(
      coordinates[coordinates.length - 1]![0]
    );
  });
});

describe("mapsHandoffUrls", () => {
  it("attaches waypoints to Google and Apple from route geometry", () => {
    const geometry: GeoJSON.LineString = {
      type: "LineString",
      coordinates: [
        [23.32, 42.7],
        [21.0, 45.0],
        [19.0, 47.0],
        [16.37, 48.21],
      ],
    };
    const urls = mapsHandoffUrls(origin, destination, geometry);
    expect(urls.waypointCount).toBe(2);
    expect(urls.google).toContain("waypoints=");
    expect(urls.apple).toContain("daddr=45%2C21");
    expect(urls.waze).toContain("from=42.7%2C23.32");
    expect(urls.waze).not.toContain("waypoints");
  });
});
