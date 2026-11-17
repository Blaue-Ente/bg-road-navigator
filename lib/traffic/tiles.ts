export interface Bbox {
  w: number;
  s: number;
  e: number;
  n: number;
}

/** Both traffic providers refuse an area wider or taller than about one degree. */
export const TILE_DEG = 1;
export const MAX_TILES = 6;

/**
 * Grid-aligned tiles that cover a bbox. Every driver looking at the same place
 * gets the same tiles, so their answers can be shared. A very wide view keeps
 * only the tiles nearest its centre, to bound the number of provider calls.
 */
export function tilesFor(bbox: Bbox, step = TILE_DEG, max = MAX_TILES): Bbox[] {
  const tiles: Bbox[] = [];
  const w0 = Math.floor(bbox.w / step);
  const e0 = Math.floor(bbox.e / step);
  const s0 = Math.floor(bbox.s / step);
  const n0 = Math.floor(bbox.n / step);
  for (let x = w0; x <= e0; x++) {
    for (let y = s0; y <= n0; y++) {
      tiles.push({ w: x * step, s: y * step, e: (x + 1) * step, n: (y + 1) * step });
    }
  }
  if (tiles.length <= max) return tiles;
  const cx = (bbox.w + bbox.e) / 2;
  const cy = (bbox.s + bbox.n) / 2;
  const distance = (tile: Bbox) =>
    Math.hypot((tile.w + tile.e) / 2 - cx, (tile.s + tile.n) / 2 - cy);
  return tiles.sort((a, b) => distance(a) - distance(b)).slice(0, max);
}

/** The bbox widened to whole degrees, so the client only asks again on a new tile. */
export function snapOutward(bbox: Bbox, step = TILE_DEG): Bbox {
  return {
    w: Math.floor(bbox.w / step) * step,
    s: Math.floor(bbox.s / step) * step,
    e: Math.ceil(bbox.e / step) * step,
    n: Math.ceil(bbox.n / step) * step,
  };
}
