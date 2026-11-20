/**
 * Quietest stretch of the day from a 24-value typical-wait profile.
 * Pure arithmetic on numbers the page already holds; no outside call.
 */
export interface QuietWindow {
  /** Local hour the window starts (0-23). */
  from: number;
  /** Local hour it ends (1-24, may be past midnight as from + hours). */
  to: number;
  /** Average typical wait inside the window, whole minutes. */
  minutes: number;
}

export function quietWindow(
  hourly: readonly number[],
  hours = 2
): QuietWindow | null {
  if (hourly.length !== 24 || hourly.some((v) => !Number.isFinite(v))) return null;
  let best: { start: number; sum: number } | null = null;
  for (let start = 0; start < 24; start += 1) {
    let sum = 0;
    for (let i = 0; i < hours; i += 1) sum += hourly[(start + i) % 24]!;
    if (best == null || sum < best.sum) best = { start, sum };
  }
  if (!best) return null;
  const max = Math.max(...hourly);
  const min = Math.min(...hourly);
  // A flat profile has no better time; say nothing rather than invent one.
  if (max - min < 5) return null;
  return {
    from: best.start,
    to: best.start + hours,
    minutes: Math.round(best.sum / hours),
  };
}
