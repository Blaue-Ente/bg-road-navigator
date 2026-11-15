/**
 * How far a station price may sit from the national average and still count
 * as normal. Green is at or below minus this share. Red is at or above plus
 * this share. One constant owns both sides.
 */
export const PRICE_BAND_THRESHOLD = 0.03;

export type PriceBand = "green" | "yellow" | "red" | "grey";

/** Lower sorts first when two priced stops share a detour budget. */
export const PRICE_BAND_RANK: Record<PriceBand, number> = {
  green: 0,
  yellow: 1,
  red: 2,
  grey: 3,
};

export const PRICE_BAND_COLOR: Record<PriceBand, string> = {
  green: "#15803d",
  yellow: "#ca8a04",
  red: "#b91c1c",
  grey: "#6b7280",
};

export function priceBand(
  stationPerL: number | null,
  averagePerL: number | null
): PriceBand {
  if (
    stationPerL == null ||
    !Number.isFinite(stationPerL) ||
    stationPerL <= 0
  ) {
    return "grey";
  }
  if (
    averagePerL == null ||
    !Number.isFinite(averagePerL) ||
    averagePerL <= 0
  ) {
    return "grey";
  }
  const ratio = (stationPerL - averagePerL) / averagePerL;
  if (ratio <= -PRICE_BAND_THRESHOLD) return "green";
  if (ratio >= PRICE_BAND_THRESHOLD) return "red";
  return "yellow";
}

/**
 * Coloured stops (green, then yellow, then red) win inside one detour budget.
 * Two greys, or two stops in the same colour, keep the existing score.
 */
export function compareFuelStops(
  a: { priceAmount: number | null; nationalAvgPerL: number | null },
  aScore: number,
  b: { priceAmount: number | null; nationalAvgPerL: number | null },
  bScore: number
): number {
  const aBand = priceBand(a.priceAmount, a.nationalAvgPerL);
  const bBand = priceBand(b.priceAmount, b.nationalAvgPerL);
  const aColoured = aBand !== "grey";
  const bColoured = bBand !== "grey";
  if (aColoured !== bColoured) return aColoured ? -1 : 1;
  if (aColoured && aBand !== bBand) {
    return PRICE_BAND_RANK[aBand] - PRICE_BAND_RANK[bBand];
  }
  return bScore - aScore;
}
