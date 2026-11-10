import { describe, expect, it } from "vitest";
import { isFatalMapError } from "@/lib/map/map-error";

describe("isFatalMapError", () => {
  it("ignores a single tile failure", () => {
    expect(
      isFatalMapError({
        sourceId: "openmaptiles",
        tile: { x: 1, y: 2, z: 3 },
        error: { message: "Failed to fetch tile" },
      })
    ).toBe(false);
  });

  it("ignores a source error even without a tile object", () => {
    expect(
      isFatalMapError({
        sourceId: "openmaptiles",
        error: { message: "AJAXError" },
      })
    ).toBe(false);
  });

  it("treats a style load failure as fatal", () => {
    expect(
      isFatalMapError({
        error: { message: "Failed to fetch style" },
      })
    ).toBe(true);
  });
});
