import { describe, expect, it } from "vitest";
import {
  parseRouteTripSession,
  readRouteTripSession,
  ROUTE_TRIP_SESSION_KEY,
  ROUTE_TRIP_SESSION_VERSION,
  writeRouteTripSession,
  type RouteTripSessionPayload,
  type TripSessionStorage,
} from "@/lib/stores/route-trip-session";

function memoryStorage(): TripSessionStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const samplePayload: RouteTripSessionPayload = {
  tripPlan: null,
  activeRoute: {
    id: "trip-1",
    origin: { id: "o", label: "A", coords: { lng: 1, lat: 2 } },
    destination: { id: "d", label: "B", coords: { lng: 3, lat: 4 } },
    waypoints: [],
    distance_km: 100,
    duration_min: 90,
    geometry: { type: "LineString", coordinates: [[1, 2], [3, 4]] },
    alternatives: [],
  },
  alternativeRoutes: [],
  planningVia: [],
  planDetailOpen: true,
};

describe("route-trip-session", () => {
  it("round-trips a payload", () => {
    const storage = memoryStorage();
    expect(writeRouteTripSession(storage, samplePayload)).toBe(true);
    const restored = readRouteTripSession(storage);
    expect(restored?.activeRoute?.id).toBe("trip-1");
    expect(restored?.planDetailOpen).toBe(true);
  });

  it("returns null on version mismatch", () => {
    const storage = memoryStorage();
    storage.setItem(
      ROUTE_TRIP_SESSION_KEY,
      JSON.stringify({ v: ROUTE_TRIP_SESSION_VERSION + 9, data: samplePayload })
    );
    expect(readRouteTripSession(storage)).toBeNull();
  });

  it("returns null on corrupt JSON", () => {
    expect(parseRouteTripSession("{not-json")).toBeNull();
    expect(parseRouteTripSession("null")).toBeNull();
  });
});
describe("route-trip-session with older single through-points", () => {
  it("reads a saved single point as a list", () => {
    const storage = memoryStorage();
    storage.setItem(
      ROUTE_TRIP_SESSION_KEY,
      JSON.stringify({
        v: ROUTE_TRIP_SESSION_VERSION,
        data: { ...samplePayload, planningVia: { label: "Ниш", lng: 21.9, lat: 43.3 } },
      })
    );
    expect(readRouteTripSession(storage)?.planningVia).toEqual([
      { label: "Ниш", lng: 21.9, lat: 43.3 },
    ]);
  });
});
