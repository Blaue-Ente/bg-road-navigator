/**
 * The country outlines are simplified, so a road that runs along a border river
 * (the Danube at the Iron Gates) can flicker into the neighbour for a few
 * kilometres. A short run of one country between two stretches of the same other
 * country is that error, not a transit, so it is absorbed into its neighbours.
 */
export const STRAY_MAX_KM = 30;

/**
 * @param labels  country code (or null) at each sample, in order
 * @param kmAt    distance along the route of each sample
 * @param spacing nominal gap between samples, added to a run's length
 */
export function absorbStrays<T extends string | null>(
  labels: T[],
  kmAt: number[],
  spacing: number,
  maxKm: number = STRAY_MAX_KM
): T[] {
  const out = [...labels];
  let i = 0;
  while (i < out.length) {
    let j = i + 1;
    while (j < out.length && out[j] === out[i]) j += 1;
    const here = out[i];
    const before = i > 0 ? out[i - 1] : undefined;
    const after = j < out.length ? out[j] : undefined;
    if (
      here &&
      before &&
      before === after &&
      before !== here &&
      (kmAt[j - 1]! - kmAt[i]!) + spacing <= maxKm
    ) {
      for (let k = i; k < j; k += 1) out[k] = before;
      // The run now joins its neighbours; look again from the earlier stretch.
      i = Math.max(0, i - 1);
      while (i > 0 && out[i - 1] === out[i]) i -= 1;
      continue;
    }
    i = j;
  }
  return out;
}
