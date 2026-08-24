import type { RoutePoint } from "@/types/route.types";

/** Full address shown in the search field after a place is chosen. */
export function formatPlaceInputValue(
  place: RoutePoint | null | undefined
): string {
  if (!place) return "";
  if (
    place.subtitle &&
    place.subtitle !== place.label &&
    !place.label.includes(place.subtitle)
  ) {
    return `${place.label}, ${place.subtitle}`;
  }
  return place.label;
}
