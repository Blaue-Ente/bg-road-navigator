import { describe, expect, it } from "vitest";
import {
  incidentQueryBboxes,
  mapIconCategory,
  mapMagnitude,
  mapTomTomIncident,
} from "@/lib/api-clients/tomtom";

describe("TomTom incident mapping", () => {
  it("maps a v5 Feature to the app incident shape", () => {
    const incident = mapTomTomIncident({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [
          [23.32, 42.7],
          [23.33, 42.71],
        ],
      },
      properties: {
        id: "inc-1",
        iconCategory: 8,
        magnitudeOfDelay: 4,
        delay: 600,
        from: "бул. Цариградско шосе",
        to: "Младост",
        startTime: "2026-08-24T03:00:00Z",
        events: [{ code: 401, description: "Closed" }],
      },
    });

    expect(incident).toMatchObject({
      id: "inc-1",
      type: "road_closure",
      title: "Затворено",
      severity: "critical",
      delayMin: 10,
      coords: { lng: 23.32, lat: 42.7 },
    });
  });

  it("splits oversized Bulgaria bbox into hotspot queries", () => {
    const boxes = incidentQueryBboxes({ w: 22, s: 41, e: 29, n: 44.5 });
    expect(boxes.length).toBeGreaterThan(1);
    expect(boxes.every((box) => box.e - box.w < 1)).toBe(true);
  });

  it("keeps a small city bbox as a single query", () => {
    const boxes = incidentQueryBboxes({
      w: 23.2,
      s: 42.6,
      e: 23.4,
      n: 42.8,
    });
    expect(boxes).toHaveLength(1);
  });

  it("maps icon categories and magnitudes", () => {
    expect(mapIconCategory(1)).toBe("accident");
    expect(mapIconCategory(6)).toBe("congestion");
    expect(mapMagnitude(3)).toBe("major");
  });
});
