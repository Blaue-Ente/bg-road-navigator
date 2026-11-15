import { describe, expect, it } from "vitest";
import {
  PRICE_BAND_THRESHOLD,
  compareFuelStops,
  priceBand,
} from "@/lib/fuel-prices/bands";

describe("price colour band", () => {
  const average = 1.6;

  it("uses one threshold for both sides", () => {
    expect(PRICE_BAND_THRESHOLD).toBe(0.03);
    expect(priceBand(average * (1 - PRICE_BAND_THRESHOLD), average)).toBe(
      "green"
    );
    expect(priceBand(average * (1 + PRICE_BAND_THRESHOLD), average)).toBe(
      "red"
    );
  });

  it("keeps a price inside the band yellow", () => {
    expect(priceBand(average * 0.98, average)).toBe("yellow");
    expect(priceBand(average, average)).toBe("yellow");
    expect(priceBand(average * 1.02, average)).toBe("yellow");
  });

  it("is grey when the station price or the average is missing", () => {
    expect(priceBand(null, average)).toBe("grey");
    expect(priceBand(1.5, null)).toBe("grey");
    expect(priceBand(0, average)).toBe("grey");
  });

  it("prefers green over yellow over red, then the existing score", () => {
    const green = { priceAmount: 1.5, nationalAvgPerL: average };
    const yellow = { priceAmount: average, nationalAvgPerL: average };
    const red = { priceAmount: 1.7, nationalAvgPerL: average };
    const grey = { priceAmount: null, nationalAvgPerL: average };

    expect(compareFuelStops(green, 1, yellow, 100)).toBeLessThan(0);
    expect(compareFuelStops(yellow, 1, red, 100)).toBeLessThan(0);
    expect(compareFuelStops(red, 1, grey, 100)).toBeLessThan(0);
    expect(compareFuelStops(grey, 4, grey, 9)).toBeGreaterThan(0);
    expect(compareFuelStops(green, 9, green, 4)).toBeLessThan(0);
  });
});
