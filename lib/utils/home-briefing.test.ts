import { describe, expect, it } from "vitest";
import { getCityById } from "@/lib/constants/european-cities";
import { calculateRouteFromCities } from "@/lib/utils/route-planner";
import {
  buildHomeBriefing,
  inferBorderIds,
  inferCountriesAlongRoute,
  isAlreadyHome,
  matchCorridor,
} from "@/lib/utils/home-briefing";

function munichSofiaRoute() {
  const route = calculateRouteFromCities(
    ["munich", "vienna", "budapest", "belgrade", "sofia"],
    13
  );
  if (!route) throw new Error("expected route");
  return route;
}

describe("home briefing", () => {
  it("matches the Munich → Sofia corridor and home destination", () => {
    const route = munichSofiaRoute();
    const briefing = buildHomeBriefing(route, {
      homeCityId: "sofia",
      now: new Date("2026-08-23T08:00:00Z"),
      vehicleType: "car",
    });

    expect(matchCorridor(route)?.id).toBe("munich-sofia");
    expect(briefing.isGoingHome).toBe(true);
    expect(briefing.matchedCorridorId).toBe("munich-sofia");
    expect(briefing.heading).toContain("София");
    expect(briefing.borderIds).toContain("kalotina");
    expect(briefing.vignettes.map((v) => v.country_code)).toEqual(
      expect.arrayContaining(["AT", "HU", "BG"])
    );
  });

  it("infers countries along a corridor route", () => {
    const route = munichSofiaRoute();
    const countries = inferCountriesAlongRoute(route);
    expect(countries).toEqual(
      expect.arrayContaining(["DE", "AT", "HU", "RS", "BG"])
    );
    expect(inferBorderIds(route).length).toBeGreaterThan(0);
  });

  it("keeps UK ferry advice for London → Sofia", () => {
    const route = calculateRouteFromCities(
      [
        "london",
        "brussels",
        "cologne",
        "frankfurt",
        "munich",
        "vienna",
        "budapest",
        "belgrade",
        "sofia",
      ],
      32
    );
    if (!route) throw new Error("expected route");

    const briefing = buildHomeBriefing(route, {
      now: new Date("2026-08-23T11:00:00Z"),
    });

    expect(briefing.tips.some((tip) => tip.id === "ferry-calais")).toBe(true);
    expect(briefing.departureAdvice).toMatch(/Eurotunnel|паром/i);
    expect(briefing.checklist.some((item) => item.id === "sleep")).toBe(true);
  });

  it("hides EV and winter tips for a short summer car trip", () => {
    const route = calculateRouteFromCities(["bucharest", "ruse", "sofia"], 5);
    if (!route) throw new Error("expected route");

    const briefing = buildHomeBriefing(route, {
      now: new Date("2026-08-23T07:00:00Z"),
      vehicleType: "car",
    });

    expect(briefing.tips.some((tip) => tip.id === "ev-charging")).toBe(false);
    expect(briefing.tips.some((tip) => tip.id === "winter-gear")).toBe(false);
    expect(briefing.tips.some((tip) => tip.id === "ferry-calais")).toBe(false);
    expect(briefing.checklist.some((item) => item.id === "docs")).toBe(true);
  });

  it("shows EV charging when the vehicle is electric", () => {
    const route = munichSofiaRoute();
    const briefing = buildHomeBriefing(route, {
      now: new Date("2026-08-23T07:00:00Z"),
      vehicleType: "ev",
    });
    expect(briefing.tips.some((tip) => tip.id === "ev-charging")).toBe(true);
    expect(
      briefing.checklist.find((item) => item.id === "fuel")?.title
    ).toMatch(/Заряд/);
  });

  it("detects already being home", () => {
    const sofia = getCityById("sofia")!;
    expect(isAlreadyHome(sofia.coords, "sofia")).toBe(true);
    expect(isAlreadyHome({ lng: 11.58, lat: 48.13 }, "sofia")).toBe(false);
  });

  it("warns about peak border hours in the afternoon", () => {
    const route = munichSofiaRoute();
    const briefing = buildHomeBriefing(route, {
      now: new Date("2026-08-21T13:00:00Z"),
      hour: 13,
      weekday: 5,
      vehicleType: "car",
    });
    expect(briefing.departureAdvice).toMatch(/пиков/i);
  });
});
