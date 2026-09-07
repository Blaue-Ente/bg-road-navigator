import type { BorderStatus } from "@/types/border.types";
import {
  BORDER_ALT_WAIT_THRESHOLD_MIN,
  getAlternativeCrossingIds,
} from "@/lib/constants/border-alternatives";

export interface BorderAlternativeSuggestion {
  crossing: BorderStatus;
  wait_delta_min: number;
  recommended: boolean;
}

/**
 * Rank known alternate crossings by car wait time vs the current border.
 */
export function rankBorderAlternatives(
  current: BorderStatus,
  allBorders: BorderStatus[]
): BorderAlternativeSuggestion[] {
  const altIds = new Set(getAlternativeCrossingIds(current.crossing_id));
  if (altIds.size === 0) return [];

  return allBorders
    .filter((b) => altIds.has(b.crossing_id))
    .map((crossing) => {
      const wait_delta_min = current.wait_time_cars - crossing.wait_time_cars;
      return {
        crossing,
        wait_delta_min,
        recommended:
          wait_delta_min >= 15 ||
          (current.wait_time_cars >= BORDER_ALT_WAIT_THRESHOLD_MIN &&
            crossing.wait_time_cars < current.wait_time_cars),
      };
    })
    .sort((a, b) => a.crossing.wait_time_cars - b.crossing.wait_time_cars);
}
