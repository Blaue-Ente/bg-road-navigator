import { describe, expect, it } from "vitest";
import { haversineKm, pathDistanceKm } from "@/lib/geo/haversine";
import {
  escapeHtml,
  isAllowedHttpsUrl,
  stripHtml,
} from "@/lib/geo/escape-html";

describe("haversineKm", () => {
  it("is ~0 for the same point", () => {
    expect(
      haversineKm({ lng: 23.3, lat: 42.7 }, { lng: 23.3, lat: 42.7 })
    ).toBe(0);
  });

  it("sums a path", () => {
    const a = { lng: 23.3, lat: 42.7 };
    const b = { lng: 23.4, lat: 42.8 };
    expect(pathDistanceKm([a, b])).toBeCloseTo(haversineKm(a, b), 5);
  });
});

describe("html helpers", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<img src="x" onerror="alert(1)">`)).not.toContain(
      "<img"
    );
  });

  it("strips tags", () => {
    expect(stripHtml("<b>Windy</b>")).toBe("Windy");
  });

  it("allowlists https hosts", () => {
    expect(
      isAllowedHttpsUrl("https://webcams.windy.com/player", ["windy.com"])
    ).toBe(true);
    expect(isAllowedHttpsUrl("https://evil.example/x", ["windy.com"])).toBe(
      false
    );
    expect(isAllowedHttpsUrl("http://webcams.windy.com/x", ["windy.com"])).toBe(
      false
    );
  });
});
