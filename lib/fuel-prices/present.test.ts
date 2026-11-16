import { describe, expect, it } from "vitest";
import { countryAverageLabel, fuelAveragesForCountries } from "@/lib/fuel-prices/present";

describe("fuel present", () => {
  it("keeps bg average line", () => {
    expect(
      countryAverageLabel({
        countryName: "България",
        fuel: "diesel",
        price: 1.9,
        locale: "bg",
      })
    ).toBe("България: дизел ср. 1,90 €/л");
  });

  it("localizes fuel averages for en", () => {
    const rows = fuelAveragesForCountries({
      countries: ["DE"],
      fuel: "diesel",
      known: new Map([["DE", { price: 1.75, week: "2026-11-10" }]]),
      locale: "en",
    });
    expect(rows[0]?.label_bg).toMatch(/Germany.*diesel.*avg.*€\/l/i);
    expect(rows[0]?.label_bg).toContain("1.75");
    expect(rows[0]?.label_bg).not.toContain("1,75");
    expect(rows[0]?.label_bg).not.toMatch(/[А-Яа-яЁё]/);
  });

  it("formats TR and RO decimals with a comma", () => {
    expect(
      countryAverageLabel({
        countryName: "Türkiye",
        fuel: "diesel",
        price: 1.75,
        locale: "tr",
      })
    ).toContain("1,75");
    expect(
      countryAverageLabel({
        countryName: "România",
        fuel: "diesel",
        price: 1.75,
        locale: "ro",
      })
    ).toContain("1,75");
  });
});