import { describe, expect, it, vi, afterEach } from "vitest";
import { readMergedAverageDetails } from "@/lib/fuel-prices/average-sources";
import { clearAveragesForTests, upsertNationalAverages } from "@/lib/fuel-prices/national-store";
import * as fueloDataCache from "@/lib/fuel-prices/fuelo-data-cache";

describe("readMergedAverageDetails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prefers bulletin over Fuelo for the same country", async () => {
    clearAveragesForTests();
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
  vi.spyOn(fueloDataCache, "readFueloAverageCached").mockResolvedValue({
      country: "DE",
      fuel: "diesel",
      date: "2026-11-15",
      price: 1.99,
      currency: "EUR",
      unit: "L",
    });
    const merged = await readMergedAverageDetails(["DE"], "diesel");
    expect(merged.get("DE")).toMatchObject({
      price: 1.55,
      source: "ec-oil-bulletin",
    });
    expect(fueloDataCache.readFueloAverageCached).not.toHaveBeenCalled();
  });

  it("falls back to Fuelo when bulletin has no row", async () => {
    clearAveragesForTests();
    vi.spyOn(fueloDataCache, "readFueloAverageCached").mockResolvedValue({
      country: "MK",
      fuel: "diesel",
      date: "2026-11-15",
      price: 1.42,
      currency: "EUR",
      unit: "L",
    });
    const merged = await readMergedAverageDetails(["MK"], "diesel");
    expect(merged.get("MK")).toMatchObject({ price: 1.42, source: "fuelo" });
    expect(fueloDataCache.readFueloAverageCached).toHaveBeenCalledWith(
      "MK",
      "diesel"
    );
  });
});