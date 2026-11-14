import { describe, expect, it } from "vitest";
import {
  appleMapsDirectionsUrl,
  appleMapsLegacyDirectionsUrl,
  buildMapsHandoff,
  googleMapsDirectionsUrl,
  MAPS_URL_MAX_LENGTH,
  stopsFromRoute,
  wazeNavigateUrl,
} from "@/lib/utils/maps-handoff";
import type { Route } from "@/types/route.types";

const origin = { lng: 23.32, lat: 42.7, label: "София" };
const via = { lng: 20.45, lat: 44.79, label: "Белград" };
const destination = { lng: 16.37, lat: 48.21, label: "Виена" };

describe("maps handoff URLs", () => {
  it("builds a Google Maps directions link", () => {
    const url = googleMapsDirectionsUrl(origin, destination);
    expect(url).toContain("https://www.google.com/maps/dir/?");
    expect(url).toContain("origin=42.7%2C23.32");
    expect(url).toContain("destination=48.21%2C16.37");
    expect(url).toContain("travelmode=driving");
    expect(url).not.toContain("waypoints=");
  });

  it("adds Google waypoints in stop order", () => {
    const url = googleMapsDirectionsUrl(origin, destination, [via]);
    expect(url).toContain("waypoints=44.79%2C20.45");
    const waypoints = new URL(url).searchParams.get("waypoints") ?? "";
    expect(waypoints.split("|")).toEqual(["44.79,20.45"]);
  });

  it("builds a unified Apple Maps directions link with waypoints", () => {
    const url = appleMapsDirectionsUrl(origin, destination, [via]);
    expect(url.startsWith("https://maps.apple.com/directions?")).toBe(true);
    const params = new URL(url).searchParams;
    expect(params.get("source")).toBe("42.7,23.32");
    expect(params.getAll("waypoint")).toEqual(["44.79,20.45"]);
    expect(params.get("destination")).toBe("48.21,16.37");
    expect(params.get("mode")).toBe("driving");
  });

  it("keeps the legacy Apple Maps URL as a fallback", () => {
    const url = appleMapsLegacyDirectionsUrl(origin, destination);
    expect(url).toContain("https://maps.apple.com/?");
    expect(url).toContain("saddr=42.7%2C23.32");
    expect(url).toContain("daddr=48.21%2C16.37");
    expect(url).toContain("dirflg=d");
  });

  it("builds a single-destination Waze link", () => {
    expect(wazeNavigateUrl(via)).toBe(
      "https://waze.com/ul?ll=44.79,20.45&navigate=yes"
    );
  });

  it("splits Google and Apple when there are more than 9 waypoints", () => {
    const stops = [
      origin,
      ...Array.from({ length: 10 }, (_, index) => ({
        lat: 43 + index * 0.4,
        lng: 23 - index * 0.5,
        label: `Спирка ${index + 1}`,
      })),
      destination,
    ];
    const plan = buildMapsHandoff(stops, { maxWaypoints: 9 });
    expect(plan.legs).toHaveLength(2);
    expect(plan.legs[0]?.waypoints).toHaveLength(9);
    expect(plan.legs[1]?.waypoints).toHaveLength(0);
    expect(plan.legs[0]?.destination).toEqual(stops[10]);
    expect(plan.legs[1]?.origin).toEqual(stops[10]);
    expect(plan.legs[1]?.destination.label).toBe("Виена");
    expect(plan.wazeStops).toHaveLength(11);
    expect(plan.wazeStops[0]?.url).toBe(wazeNavigateUrl(stops[1]!));
    expect(plan.wazeStops[0]?.url).not.toContain("waypoint");
  });

  it("uses fewer waypoints on a mobile limit and still covers the trip", () => {
    const stops = [
      origin,
      via,
      { lat: 47.5, lng: 19.04, label: "Будапеща" },
      destination,
    ];
    const plan = buildMapsHandoff(stops, { maxWaypoints: 3 });
    expect(plan.legs).toHaveLength(1);
    expect(plan.legs[0]?.waypoints).toHaveLength(2);

    const crowded = buildMapsHandoff(
      [
        origin,
        { lat: 43, lng: 22, label: "1" },
        { lat: 44, lng: 21, label: "2" },
        { lat: 45, lng: 20, label: "3" },
        { lat: 46, lng: 19, label: "4" },
        destination,
      ],
      { maxWaypoints: 3 }
    );
    expect(crowded.legs).toHaveLength(2);
    expect(crowded.legs[0]?.waypoints).toHaveLength(3);
    expect(crowded.legs[1]?.destination.label).toBe("Виена");
    expect(crowded.wazeStops.map((stop) => stop.label)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "Виена",
    ]);
  });

  it("splits a leg when the directions URL would pass the length cap", () => {
    const stops = [
      origin,
      { lat: 43.2, lng: 22.2, label: "1" },
      { lat: 44.2, lng: 21.2, label: "2" },
      destination,
    ];
    const roomy = buildMapsHandoff(stops);
    expect(roomy.legs).toHaveLength(1);
    const directGoogle = googleMapsDirectionsUrl(origin, destination);
    const directApple = appleMapsDirectionsUrl(origin, destination);
    const cap = Math.max(directGoogle.length, directApple.length) + 8;
    const plan = buildMapsHandoff(stops, { maxUrlLength: cap });
    expect(plan.legs.length).toBeGreaterThan(1);
    for (const leg of plan.legs) {
      expect(leg.waypoints).toHaveLength(0);
      expect(leg.googleUrl.length).toBeLessThanOrEqual(cap);
      expect(leg.appleUrl.length).toBeLessThanOrEqual(cap);
      expect(leg.appleLegacyUrl).toContain("saddr=");
      expect(leg.appleUrl).toContain("/directions?");
    }
    expect(plan.legs.at(-1)?.destination.label).toBe("Виена");
    expect(MAPS_URL_MAX_LENGTH).toBe(2048);
  });

  it("reads planned stops off a route", () => {
    const route = {
      origin: { id: "a", label: "София", coords: origin },
      destination: { id: "c", label: "Виена", coords: destination },
      waypoints: [{ id: "b", label: "Белград", coords: via }],
    } as Pick<Route, "origin" | "destination" | "waypoints">;
    const plan = buildMapsHandoff(stopsFromRoute(route));
    expect(plan.legs).toHaveLength(1);
    expect(plan.legs[0]?.waypoints.map((stop) => stop.label)).toEqual([
      "Белград",
    ]);
    expect(plan.wazeStops.map((stop) => stop.label)).toEqual([
      "Белград",
      "Виена",
    ]);
  });
});
