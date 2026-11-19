import { describe, expect, it } from "vitest";
import {
  connectorGroup,
  filterChargers,
  filterStationsByFuel,
  stationHasFuel,
} from "@/lib/fuel/filters";
import type { EVStation, FuelStation } from "@/types/fuel.types";

const station = (over: Partial<FuelStation>): FuelStation =>
  ({ id: "s", name: "S", brand: "B", coords: { lng: 0, lat: 0 }, prices: {}, open: true, distance_km: 1, payment_methods: [], ...over }) as FuelStation;

const charger = (power: number, types: string[]): EVStation =>
  ({ id: "c", name: "C", operator: "O", coords: { lng: 0, lat: 0 }, power_kw: power, connector_types: types, availability: "unknown", price_kwh: null, distance_km: 1 }) as EVStation;

describe("fuel filter", () => {
  it("counts a tag or a price as having the fuel", () => {
    expect(stationHasFuel(station({ fuel_types: ["lpg"] }), "lpg")).toBe(true);
    expect(stationHasFuel(station({ prices: { diesel: 1.9 } }), "diesel")).toBe(true);
    expect(stationHasFuel(station({}), "diesel")).toBe(false);
  });

  it("keeps stations with every chosen fuel, and all when none is chosen", () => {
    const list = [
      station({ id: "a", fuel_types: ["diesel", "lpg"] }),
      station({ id: "b", fuel_types: ["diesel"] }),
    ];
    expect(filterStationsByFuel(list, [])).toHaveLength(2);
    expect(filterStationsByFuel(list, ["diesel", "lpg"]).map((s) => s.id)).toEqual(["a"]);
  });
});

describe("charger filter", () => {
  it("groups plug titles", () => {
    expect(connectorGroup("CCS (Type 2 Combo)")).toBe("ccs");
    expect(connectorGroup("CHAdeMO")).toBe("chademo");
    expect(connectorGroup("Type 2 (Socket Only)")).toBe("type2");
    expect(connectorGroup("Tesla Supercharger")).toBe("other");
  });

  it("filters by power and plug", () => {
    const list = [charger(22, ["Type 2 (Socket Only)"]), charger(150, ["CCS (Type 2 Combo)"]), charger(50, ["CHAdeMO"])];
    expect(filterChargers(list, { minKw: 50, connectors: [] })).toHaveLength(2);
    expect(filterChargers(list, { minKw: 0, connectors: ["ccs"] })).toHaveLength(1);
    expect(filterChargers(list, { minKw: 100, connectors: ["chademo"] })).toHaveLength(0);
  });
});
