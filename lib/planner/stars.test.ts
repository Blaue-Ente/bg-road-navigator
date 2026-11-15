import { describe, expect, it } from "vitest";
import { starsFromTags } from "@/lib/planner/stars";

describe("starsFromTags", () => {
  it("reads an integer star class", () => {
    expect(starsFromTags({ stars: "4" })).toBe(4);
    expect(starsFromTags({ "stars:hotel": "3" })).toBe(3);
  });

  it("ignores missing and out-of-range tags", () => {
    expect(starsFromTags(undefined)).toBeNull();
    expect(starsFromTags({ stars: "0" })).toBeNull();
    expect(starsFromTags({ stars: "luxury" })).toBeNull();
  });
});
