import { describe, expect, it } from "vitest";
import { isMapReady } from "@/lib/map/is-map-ready";
import type { Map } from "maplibre-gl";

describe("isMapReady", () => {
  it("rejects nullish maps", () => {
    expect(isMapReady(null)).toBe(false);
    expect(isMapReady(undefined)).toBe(false);
  });

  it("rejects maps without a style", () => {
    const map = {
      getStyle: () => undefined,
    } as unknown as Map;
    expect(isMapReady(map)).toBe(false);
  });

  it("accepts maps with a style object", () => {
    const map = {
      getStyle: () => ({ version: 8, layers: [] }),
    } as unknown as Map;
    expect(isMapReady(map)).toBe(true);
  });

  it("treats getStyle throwing as not ready", () => {
    const map = {
      getStyle: () => {
        throw new Error("removed");
      },
    } as unknown as Map;
    expect(isMapReady(map)).toBe(false);
  });
});
