import { describe, expect, it } from "vitest";
import { toEuro } from "@/lib/fuel-prices/to-eur";

describe("fuel price in euro", () => {
  it("leaves a euro price alone", () => {
    expect(toEuro(1.9, "EUR")).toBe(1.9);
    expect(toEuro(1.9, "")).toBe(1.9);
  });

  it("turns dinars into euro, so 235 dinars is not 235 euro", () => {
    expect(toEuro(235.62, "RSD")).toBeCloseTo(2.01, 2);
  });

  it("uses the ECB rate for liras and leva", () => {
    expect(toEuro(50, "TRY", { TRY: 50 })).toBe(1);
    expect(toEuro(1.9558, "BGN")).toBeCloseTo(1, 2);
  });

  it("gives nothing for a currency it has no rate for", () => {
    expect(toEuro(10, "XYZ")).toBeNull();
  });
});
