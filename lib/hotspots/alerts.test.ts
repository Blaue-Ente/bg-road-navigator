import { describe, expect, it } from "vitest";
import { alertsAhead, throttleAlerts } from "@/lib/hotspots/alerts";
import { HOTSPOT_ALERTS } from "@/lib/i18n/hotspot-alerts";

const line: Array<[number, number]> = [
  [20, 44],
  [20, 44.02],
  [20, 44.05],
];

describe("proximity alerts", () => {
  it("speaks once for a hotspot about 800 m ahead", () => {
    const alerts = alertsAhead({
      line,
      position: { lng: 20, lat: 44 },
      aheadM: 1000,
      targets: [
        { id: "hot-1", lng: 20, lat: 44.0072, kind: "hotspot" },
        { id: "far", lng: 20, lat: 44.04, kind: "hazard" },
        { id: "behind", lng: 20, lat: 43.99, kind: "hotspot" },
      ],
    });
    expect(alerts.map((alert) => alert.id)).toEqual(["hot-1"]);
    expect(alerts[0]?.text).toBe(HOTSPOT_ALERTS.hotspot(alerts[0]!.distanceM));
    expect(alerts[0]?.text.startsWith("След ")).toBe(true);
    expect(alerts[0]?.text).toContain("участък с чести катастрофи");
    expect(alerts[0]!.distanceM).toBeGreaterThan(600);
    expect(alerts[0]!.distanceM).toBeLessThan(1000);

    const first = throttleAlerts(alerts, new Set());
    expect(first.fresh).toHaveLength(1);
    const again = throttleAlerts(alerts, first.seen);
    expect(again.fresh).toEqual([]);
  });

  it("stays quiet when the look-ahead is shorter than the gap", () => {
    const alerts = alertsAhead({
      line,
      position: { lng: 20, lat: 44 },
      aheadM: 200,
      targets: [{ id: "hot-1", lng: 20, lat: 44.0072, kind: "hotspot" }],
    });
    expect(alerts).toEqual([]);
  });
});
