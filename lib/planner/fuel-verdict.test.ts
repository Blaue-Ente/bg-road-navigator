import { describe, expect, it } from "vitest";
import { fuelVerdict } from "@/lib/planner/fuel-verdict";

describe("fuel verdict", () => {
  it("avoids a red price and a dirty or unsafe flag", () => {
    expect(fuelVerdict({ price_band: "red", flags: [] })).toEqual({
      verdict: "avoid",
      reasons: ["expensive"],
    });
    expect(
      fuelVerdict({ price_band: "green", flags: [{ flag: "dirty", weight: 2 }] })
    ).toEqual({ verdict: "avoid", reasons: ["dirty"] });
  });

  it("likes a green price and a clean flag", () => {
    const result = fuelVerdict({
      price_band: "green",
      flags: [{ flag: "clean", weight: 1 }],
    });
    expect(result.verdict).toBe("good");
    expect(result.reasons).toEqual(["clean", "cheap"]);
  });

  it("does not judge a stop without a price or flags", () => {
    expect(fuelVerdict({ price_band: "grey", flags: [] })).toEqual({
      verdict: "ok",
      reasons: ["noPrice"],
    });
  });
});
