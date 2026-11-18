import type { ProvidedRoadRoute, ScenicInfo } from "@/lib/api-clients/road-route";

/** The scenic road may take at most this much longer than the fast one... */
export const SCENIC_MAX_RATIO = 1.25;
/** ...and at most this many minutes longer. */
export const SCENIC_MAX_EXTRA_MIN = 120;
/** Below this the two roads are the same for the driver. */
const SAME_KM = 5;
const SAME_MIN = 5;

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Picks between the fast road and the scenic one. The scenic road is used only
 * when it really differs and costs no more than +25% time and +2 hours; a long
 * trip on small roads would add days. The answer carries what was decided.
 */
export function chooseScenicRoute(
  fast: ProvidedRoadRoute | null,
  scenic: ProvidedRoadRoute | null
): ProvidedRoadRoute | null {
  if (!fast) return null;
  if (!scenic) {
    return {
      ...fast,
      scenic: { applied: false, reason: "unsupported", extra_km: null, extra_min: null },
    };
  }
  const extraKm = round1(scenic.distance_km - fast.distance_km);
  const extraMin = Math.round(scenic.duration_min - fast.duration_min);
  const info = (applied: boolean, reason: ScenicInfo["reason"]): ScenicInfo => ({
    applied,
    reason,
    extra_km: extraKm,
    extra_min: extraMin,
  });
  if (Math.abs(extraKm) < SAME_KM && Math.abs(extraMin) < SAME_MIN) {
    return { ...fast, scenic: info(false, "same") };
  }
  if (
    scenic.duration_min > fast.duration_min * SCENIC_MAX_RATIO ||
    extraMin > SCENIC_MAX_EXTRA_MIN
  ) {
    return { ...fast, scenic: info(false, "too_long") };
  }
  return { ...scenic, scenic: info(true, "applied") };
}
