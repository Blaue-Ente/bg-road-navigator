import { afterEach, describe, expect, it } from "vitest";
import { getMapStyleUrl, LIGHT_MAP_STYLE, DARK_MAP_STYLE } from "@/lib/constants/map-style";

describe("getMapStyleUrl", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  });

  it("uses the light day style when env is empty or whitespace", () => {
    process.env.NEXT_PUBLIC_MAP_STYLE_URL = "";
    expect(getMapStyleUrl()).toBe(LIGHT_MAP_STYLE);

    process.env.NEXT_PUBLIC_MAP_STYLE_URL = "   ";
    expect(getMapStyleUrl()).toBe(LIGHT_MAP_STYLE);
    expect(getMapStyleUrl("light")).toContain("positron");
  });

  it("uses a custom style when provided, for either scheme", () => {
    process.env.NEXT_PUBLIC_MAP_STYLE_URL = "https://example.com/style.json";
    expect(getMapStyleUrl()).toBe("https://example.com/style.json");
    expect(getMapStyleUrl("dark")).toBe("https://example.com/style.json");
  });

  it("offers a dark style when no custom style is set", () => {
    delete process.env.NEXT_PUBLIC_MAP_STYLE_URL;
    expect(getMapStyleUrl("dark")).toBe(DARK_MAP_STYLE);
  });
});
