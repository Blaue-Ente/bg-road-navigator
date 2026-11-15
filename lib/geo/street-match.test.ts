import { describe, expect, it } from "vitest";
import { foldStreetName, streetTier } from "@/lib/geo/street-match";

describe("foldStreetName", () => {
  it("treats бул./ул./пл. and Latin spellings as the same street", () => {
    const folded = foldStreetName("Витоша");
    expect(foldStreetName("бул. Витоша")).toBe(folded);
    expect(foldStreetName("ул. Витоша")).toBe(folded);
    expect(foldStreetName("пл. Витоша")).toBe(folded);
    expect(foldStreetName("bul. Vitosha")).toBe(folded);
    expect(foldStreetName("boulevard Vitosha")).toBe(folded);
    expect(folded).toBe("vitosha");
  });
});

describe("streetTier", () => {
  it("matches a street substring and rejects a different street", () => {
    expect(streetTier("Витоша", "бул. Витоша")).toBe("exact");
    expect(streetTier("Витоша", "bul. Vitosha 1")).toBe("exact");
    expect(streetTier("Витоша", "ул. Димитър Манчев")).toBe("none");
  });
});
