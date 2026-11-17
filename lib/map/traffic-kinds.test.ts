import { describe, expect, it } from "vitest";
import {
  TRAFFIC_GROUP_KINDS,
  TRAFFIC_KIND_STYLE,
  TRAFFIC_GROUPS,
  trafficPinSize,
  type TrafficKind,
} from "@/lib/map/traffic-kinds";
import { poiIconSvg } from "@/lib/map/poi-icons";

describe("traffic kinds", () => {
  const kinds = Object.keys(TRAFFIC_KIND_STYLE) as TrafficKind[];

  it("gives every kind its own colour and pictogram where it matters", () => {
    expect(new Set(kinds.map((k) => TRAFFIC_KIND_STYLE[k].color)).size).toBe(kinds.length);
    for (const kind of ["accident", "road_closure", "lane_restriction", "construction"] as const) {
      const others = kinds.filter((k) => k !== kind);
      expect(others.some((k) => TRAFFIC_KIND_STYLE[k].icon === TRAFFIC_KIND_STYLE[kind].icon)).toBe(false);
    }
  });

  it("lists every kind in exactly one group", () => {
    const listed = TRAFFIC_GROUPS.flatMap((g) => TRAFFIC_GROUP_KINDS[g]);
    expect([...listed].sort()).toEqual([...kinds].sort());
    for (const g of TRAFFIC_GROUPS) {
      for (const k of TRAFFIC_GROUP_KINDS[g]) expect(TRAFFIC_KIND_STYLE[k].group).toBe(g);
    }
  });

  it("makes serious events bigger and draws a pin as svg", () => {
    expect(trafficPinSize("critical")).toBeGreaterThan(trafficPinSize("major"));
    expect(trafficPinSize("major")).toBeGreaterThan(trafficPinSize("minor"));
    const svg = poiIconSvg("ban", "#7F1D1D", 30);
    expect(svg).toContain('width="30"');
    expect(svg).toContain("#7F1D1D");
    expect(svg).toContain("<path");
  });
});
