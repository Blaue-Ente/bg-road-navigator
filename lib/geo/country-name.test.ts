import { describe, expect, it } from "vitest";
import { countryName } from "@/lib/geo/country-name";

describe("countryName", () => {
  it("uses standard region names per locale", () => {
    expect(countryName("BG", "tr")).toBe("Bulgaristan");
    expect(countryName("HU", "ro")).toBe("Ungaria");
    expect(countryName("GR", "en")).toBe("Greece");
  });

  it("keeps the Bulgarian table for bg locale", () => {
    expect(countryName("BG", "bg")).toBe("България");
  });
});