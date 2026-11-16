import { describe, expect, it } from "vitest";
import { pluralRo } from "@/lib/i18n/plural";

describe("pluralRo", () => {
  it("matches the de rule for Romanian plurals", () => {
    expect(pluralRo(1)).toBe("one");
    expect(pluralRo(7)).toBe("few");
    expect(pluralRo(110)).toBe("few");
    expect(pluralRo(101)).toBe("few");
    expect(pluralRo(20)).toBe("many");
    expect(pluralRo(120)).toBe("many");
  });
});