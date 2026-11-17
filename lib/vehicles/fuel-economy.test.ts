import { describe, expect, it } from "vitest";
import {
  candidateFromRecord,
  kwhPer100MilesToKm,
  lookupConsumption,
  matchMake,
  matchModels,
  mpgToLPer100,
  parseVehicleQuery,
} from "@/lib/vehicles/fuel-economy";

describe("conversions", () => {
  it("converts mpg to L/100 km", () => {
    expect(mpgToLPer100(36)).toBe(6.5);
  });
  it("converts kWh/100 mi to kWh/100 km", () => {
    expect(kwhPer100MilesToKm(32)).toBe(19.9);
  });
});

describe("query parsing", () => {
  it("finds the year and the words", () => {
    expect(parseVehicleQuery("VW Passat 2018 2.0 TDI")).toEqual({
      year: 2018,
      tokens: ["vw", "passat", "2", "0", "tdi"],
    });
  });
  it("matches aliases and longer makes first", () => {
    const makes = ["Volkswagen", "Land Rover", "Rover"];
    expect(matchMake(["vw", "passat"], makes)).toBe("Volkswagen");
    expect(matchMake(["land", "rover", "defender"], makes)).toBe("Land Rover");
  });
  it("ranks models by shared words", () => {
    const models = ["Passat", "Golf", "Golf SportWagen"];
    expect(matchModels(["vw", "passat", "tdi"], "Volkswagen", models)[0]).toBe(
      "Passat"
    );
    expect(matchModels(["golf", "sportwagen"], "Volkswagen", models)[0]).toBe(
      "Golf SportWagen"
    );
  });
});

describe("candidateFromRecord", () => {
  it("reads a petrol record", () => {
    const row = candidateFromRecord({
      year: "2018",
      make: "Volkswagen",
      model: "Passat",
      highway08: "36",
      comb08: "29",
      fuelType1: "Regular Gasoline",
    });
    expect(row?.highway_per_100).toBe(6.5);
    expect(row?.fuel_type).toBe("petrol");
  });
  it("reads an electric record", () => {
    const row = candidateFromRecord({
      year: "2021",
      make: "Tesla",
      model: "Model 3",
      fuelType1: "Electricity",
      highwayE: "30",
      combE: "26",
      range: "263",
    });
    expect(row?.vehicle_type).toBe("ev");
    expect(row?.ev_range_km).toBe(423);
  });
  it("skips records without data", () => {
    expect(candidateFromRecord({ year: "2018", fuelType1: "Regular" })).toBeNull();
  });
});

describe("lookupConsumption", () => {
  it("walks make → model → options → record", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string) => {
      calls.push(url);
      const body = url.includes("menu/make")
        ? { menuItem: [{ text: "Volkswagen", value: "Volkswagen" }] }
        : url.includes("menu/model")
          ? { menuItem: [{ text: "Passat", value: "Passat" }] }
          : url.includes("menu/options")
            ? { menuItem: [{ text: "Auto, 4 cyl", value: "38938" }] }
            : {
                year: "2018",
                make: "Volkswagen",
                model: "Passat",
                highway08: "36",
                comb08: "29",
                fuelType1: "Regular Gasoline",
              };
      return new Response(JSON.stringify(body), { status: 200 });
    }) as unknown as typeof fetch;
    const rows = await lookupConsumption("VW Passat 2018", fetchImpl);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.highway_per_100).toBe(6.5);
    expect(calls.length).toBe(4);
  });
  it("returns nothing for an unknown make", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ menuItem: [{ text: "Audi", value: "Audi" }] }), {
        status: 200,
      })) as unknown as typeof fetch;
    expect(await lookupConsumption("Skoda Octavia 2019", fetchImpl)).toEqual([]);
  });
});
