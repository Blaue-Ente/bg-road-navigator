import { describe, expect, it } from "vitest";
import { stopPriceCopy } from "@/lib/planner/stop-price";

describe("stopPriceCopy", () => {
  it("marks a fuel stop without a station price as unknown", () => {
    expect(
      stopPriceCopy({
        kinds: ["fuel"],
        price: null,
      })
    ).toBe("unknown");
  });

  it("marks a fuel stop with a station price as station", () => {
    expect(
      stopPriceCopy({
        kinds: ["fuel"],
        price: {
          amount: 1.82,
          currency: "EUR",
          unit: "L",
          source: "community",
          observed_at: "2026-11-15T08:00:00.000Z",
        },
      })
    ).toBe("station");
  });

  it("ignores non-fuel stops without prices", () => {
    expect(stopPriceCopy({ kinds: ["rest"], price: null })).toBe("none");
  });
});