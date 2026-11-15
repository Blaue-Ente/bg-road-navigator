import { afterEach, describe, expect, it } from "vitest";
import {
  clearAveragesForTests,
  readLatestAverageDetails,
  upsertNationalAverages,
} from "@/lib/fuel-prices/national-store";
import {
  countryAverageLabel,
  fuelAveragesForCountries,
  presentFuelStop,
  priceDeltaLabel,
} from "@/lib/fuel-prices/present";

afterEach(() => {
  clearAveragesForTests();
});

describe("national average lookup", () => {
  it("labels a known country and falls back when the bulletin has no row", () => {
    const rows = fuelAveragesForCountries({
      countries: ["BG", "RS", "bg"],
      fuel: "diesel",
      known: new Map([["BG", { price: 1.9, week: "2026-11-09" }]]),
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      country_code: "BG",
      country_name_bg: "България",
      price_eur_per_l: 1.9,
      week: "2026-11-09",
      week_label_bg: "9.11.2026",
      source: "ec-oil-bulletin",
      source_label_bg: "Европейска комисия, Weekly Oil Bulletin",
      label_bg: "България: дизел ср. 1,90 €/л",
    });
    expect(rows[1]).toMatchObject({
      country_code: "RS",
      country_name_bg: "Сърбия",
      price_eur_per_l: null,
      week: null,
      source: null,
      label_bg: "Сърбия: няма средна цена",
    });
  });

  it("does not invent a litre price for an electric car", () => {
    expect(
      fuelAveragesForCountries({
        countries: ["BG"],
        fuel: "electric",
        known: new Map([["BG", { price: 1.9, week: "2026-11-09" }]]),
      })
    ).toEqual([]);
  });

  it("reads the newest stored week and omits a country that was never stored", async () => {
    await upsertNationalAverages(
      [
        {
          countryCode: "BG",
          fuel: "diesel",
          eurPerLitre: 1.8,
          week: "2026-11-02",
        },
        {
          countryCode: "BG",
          fuel: "diesel",
          eurPerLitre: 1.9,
          week: "2026-11-09",
        },
        {
          countryCode: "AT",
          fuel: "petrol",
          eurPerLitre: 1.55,
          week: "2026-11-09",
        },
      ],
      new Date("2026-11-10T06:00:00.000Z")
    );

    const diesel = await readLatestAverageDetails(["bg", "RS"], "diesel");
    expect(diesel.get("BG")).toEqual({
      price: 1.9,
      week: "2026-11-09",
      source: "ec-oil-bulletin",
    });
    expect(diesel.has("RS")).toBe(false);

    const rows = fuelAveragesForCountries({
      countries: ["BG", "RS"],
      fuel: "diesel",
      known: diesel,
    });
    expect(rows[1]?.label_bg).toBe("Сърбия: няма средна цена");
    expect(await readLatestAverageDetails(["BG"], "petrol")).toEqual(new Map());
  });
});

describe("fuel stop copy", () => {
  const now = new Date("2026-11-15T12:00:00.000Z");

  it("formats the saving against a 50 l fill", () => {
    expect(
      countryAverageLabel({
        countryName: "България",
        fuel: "diesel",
        price: 1.9,
      })
    ).toBe("България: дизел ср. 1,90 €/л");
    expect(
      priceDeltaLabel({ stationPerL: 1.82, averagePerL: 1.9, liters: 50 })
    ).toBe("−0,08 €/л, спестяваш ~4 € за 50 л");
  });

  it("names a community report by its age and an official source by its publisher", () => {
    const community = presentFuelStop({
      countryCode: "BG",
      fuel: "diesel",
      average: { price: 1.9, week: "2026-11-09" },
      stationPerL: 1.82,
      source: "community",
      observedAt: "2026-11-15T09:00:00.000Z",
      liters: 50,
      now,
    });
    expect(community.price_band).toBe("green");
    expect(community.price_label_bg).toBe("1,820 €/л");
    expect(community.price_source_label_bg).toBe("от потребител, преди 3 ч");
    expect(community.average_label_bg).toBe("България: дизел ср. 1,90 €/л");

    const official = presentFuelStop({
      countryCode: "AT",
      fuel: "petrol",
      average: { price: 1.55, week: "2026-11-09" },
      stationPerL: 1.7,
      source: "e-control",
      observedAt: now.toISOString(),
      liters: 40,
      now,
    });
    expect(official.price_band).toBe("red");
    expect(official.price_source_label_bg).toBe("E-Control");
    expect(official.price_delta_label_bg).toContain("плащаш");
  });

  it("keeps the unknown-price fallback when the station has no figure", () => {
    const copy = presentFuelStop({
      countryCode: "HU",
      fuel: "diesel",
      average: { price: 1.7, week: "2026-11-09" },
      stationPerL: null,
      source: null,
      observedAt: null,
      liters: 50,
      now,
    });
    expect(copy.price_band).toBe("grey");
    expect(copy.price_label_bg).toBeNull();
    expect(copy.price_delta_label_bg).toBeNull();
    expect(copy.average_label_bg).toBe("Унгария: дизел ср. 1,70 €/л");
  });
});
