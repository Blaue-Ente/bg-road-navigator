import { formatTemplate } from "@/lib/i18n/format-template";
import type { MessageCatalog } from "@/lib/i18n/locales/bg";
import { formatClockDuration, type DurationUnits } from "@/lib/planner/itinerary";
import type { TripPlannerResult } from "@/lib/planner/types";

export function arrivalIncludesMessage(
  plan: TripPlannerResult,
  sheet: MessageCatalog["sheet"],
  units: DurationUnits
): string | null {
  const breaksMin = plan.route.breaks_min ?? 0;
  const hasOvernight = plan.stops.some(
    (stop) => stop.sleep_min != null && stop.sleep_min > 0
  );
  if (breaksMin <= 0 && !hasOvernight) return null;
  const breaksLabel = formatClockDuration(breaksMin, units);
  if (breaksMin > 0 && hasOvernight) {
    return formatTemplate(sheet.arrivalIncludes, { breaks: breaksLabel });
  }
  if (breaksMin > 0) {
    return formatTemplate(sheet.arrivalIncludesBreaksOnly, {
      breaks: breaksLabel,
    });
  }
  return sheet.arrivalIncludesOvernightOnly;
}