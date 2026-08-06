import { describe, expect, it } from "vitest";
import { getMapStyleUrl, WAZE_DARK_STYLE } from "@/lib/constants/map-style";

describe("getMapStyleUrl", () => {
  it("falls back when env is empty or whitespace", () => {
    process.env.NEXT_PUBLIC_MAP_STYLE_URL = "";
    expect(getMapStyleUrl()).toBe(WAZE_DARK_STYLE);

    process.env.NEXT_PUBLIC_MAP_STYLE_URL = "   ";
    expect(getMapStyleUrl()).toBe(WAZE_DARK_STYLE);
  });

  it("uses a custom style when provided", () => {
    process.env.NEXT_PUBLIC_MAP_STYLE_URL = "https://example.com/style.json";
    expect(getMapStyleUrl()).toBe("https://example.com/style.json");
  });
});
