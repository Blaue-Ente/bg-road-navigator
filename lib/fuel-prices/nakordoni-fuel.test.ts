import { describe, expect, it, beforeEach } from "vitest";
import {
  clearNakordoniFuelCacheForTests,
  parseNakordoniFuelStations,
} from "@/lib/fuel-prices/nakordoni-fuel";

describe("nakordoni fuel stations", () => {
  beforeEach(() => {
    clearNakordoniFuelCacheForTests();
  });

  it("maps station prices into FuelStation shape", () => {
    const rows = parseNakordoniFuelStations(
      {
        ok: true,
        data: {
          stations: [
            {
              id: "st-1",
              name: "OMV Ring",
              brand: "OMV",
              lat: 42.7,
              lng: 23.3,
              distance_km: 2.1,
              prices: {
                diesel: { price: 1.62, currency: "EUR" },
                petrol95: { price: 1.71, currency: "EUR" },
              },
            },
          ],
        },
      },
      42.69,
      23.32
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.prices.diesel).toBe(1.62);
    expect(rows[0]?.prices.petrol95).toBe(1.71);
  });

  it("returns an empty list for malformed payloads", () => {
    expect(parseNakordoniFuelStations(null, 0, 0)).toEqual([]);
  });
});