import type { RoutePoint } from "@/types/route.types";

/** A typed string is not a place. Null means the field is empty or edited. */
export function committedPlace(
  selected: RoutePoint | null,
  query: string
): RoutePoint | null {
  if (!selected) return null;
  if (query.trim() !== selected.label.trim()) return null;
  return selected;
}