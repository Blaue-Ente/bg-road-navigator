import { describe, expect, it } from "vitest";
import { snapOutward, tilesFor } from "@/lib/traffic/tiles";

describe("tilesFor", () => {
  it("covers a view with one-degree grid tiles shared between drivers", () => {
    expect(tilesFor({ w: 22.3, s: 41.2, e: 22.9, n: 41.9 })).toEqual([
      { w: 22, s: 41, e: 23, n: 42 },
    ]);
    expect(tilesFor({ w: 22.3, s: 41.2, e: 23.4, n: 41.9 })).toHaveLength(2);
  });
  it("keeps only the tiles nearest the centre of a very wide view", () => {
    const tiles = tilesFor({ w: 22, s: 41, e: 29, n: 44.5 });
    expect(tiles).toHaveLength(6);
    const centreLng = 25.5;
    for (const tile of tiles) {
      expect(Math.abs((tile.w + tile.e) / 2 - centreLng)).toBeLessThanOrEqual(2);
    }
  });
});

describe("snapOutward", () => {
  it("widens to whole degrees so the client asks again only on a new tile", () => {
    expect(snapOutward({ w: 22.3, s: 41.2, e: 22.9, n: 41.9 })).toEqual({
      w: 22,
      s: 41,
      e: 23,
      n: 42,
    });
  });
});
