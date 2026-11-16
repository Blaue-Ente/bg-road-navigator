import { describe, expect, it } from "vitest";
import { readMergedAverageDetails } from "@/lib/fuel-prices/average-sources";
import { clearFueloCacheForTests, writeFueloAverage } from "@/lib/fuel-prices/fuelo-cache";
import { clearAveragesForTests, upsertNationalAverages } from "@/lib/fuel-prices/national-store";

describe("readMergedAverageDetails", () => {
  it("prefers bulletin over Fuelo for the same country", async () => {
    clearAveragesForTests();
    clearFueloCacheForTests();
    await upsertNationalAverages(
      [
        {
          countryCode: "DE",
          fuel: "diesel",
          eurPerLitre: 1.55,
          week: "2026-11-10",
        },
      ],
      new Date("2026-11-16T08:00:00Z")
    );
    writeFueloAverage(
      {
        country: "DE",
        fuel: "diesel",
        date: "2026-11-15",
        price: 1.99,
        currency: "EUR",
        unit: "L",
      },
      "diesel"
    );
    const merged = await readMergedAverageDetails(["DE"], "diesel");
    expect(merged.get("DE")).toMatchObject({
      price: 1.55,
      source: "ec-oil-bulletin",
    });
  });

  it("falls back to Fuelo when bulletin has no row", async () => {
    clearAveragesForTests();
    clearFueloCacheForTests();
    writeFueloAverage(
      {
        country: "MK",
        fuel: "diesel",
        date: "2026-11-15",
        price: 1.42,
        currency: "EUR",
        unit: "L",
      },
      "diesel"
    );
    const merged = await readMergedAverageDetails(["MK"], "diesel");
    expect(merged.get("MK")).toMatchObject({ price: 1.42, source: "fuelo" });
  });
});