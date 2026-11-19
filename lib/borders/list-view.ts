import type { BorderStatus } from "@/types/border.types";

export const MAX_PINNED_BORDERS = 3;

export type BusyFilter = "all" | "light" | "medium" | "heavy";
export type BorderSort = "default" | "wait";

/** Minutes of waiting for a car that count as light, medium and heavy. */
export const LIGHT_MAX_MIN = 15;
export const MEDIUM_MAX_MIN = 45;

export interface BorderListFilter {
  /** A two-letter country, or null for all. */
  country: string | null;
  busy: BusyFilter;
  sort: BorderSort;
}

export const EMPTY_BORDER_FILTER: BorderListFilter = {
  country: null,
  busy: "all",
  sort: "default",
};

/** "BG - RS" → ["BG", "RS"]. */
export function countriesOf(pair: string): string[] {
  return pair
    .split(/[-–—/]/)
    .map((part) => part.trim().toUpperCase())
    .filter((code) => /^[A-Z]{2}$/.test(code));
}

export function countriesInList(list: BorderStatus[]): string[] {
  const seen = new Set<string>();
  for (const border of list) for (const code of countriesOf(border.country_pair)) seen.add(code);
  return [...seen].sort();
}

export function busyLevel(waitMin: number): Exclude<BusyFilter, "all"> {
  if (waitMin <= LIGHT_MAX_MIN) return "light";
  if (waitMin <= MEDIUM_MAX_MIN) return "medium";
  return "heavy";
}

export function filterBorders(list: BorderStatus[], filter: BorderListFilter): BorderStatus[] {
  const out = list.filter((border) => {
    if (filter.country && !countriesOf(border.country_pair).includes(filter.country)) return false;
    if (filter.busy !== "all" && busyLevel(border.wait_time_cars) !== filter.busy) return false;
    return true;
  });
  if (filter.sort === "wait") {
    out.sort((a, b) => a.wait_time_cars - b.wait_time_cars);
  }
  return out;
}

/** The pinned crossings in the order they were pinned, and the rest. */
export function splitPinned(
  list: BorderStatus[],
  pinned: string[]
): { pinned: BorderStatus[]; rest: BorderStatus[] } {
  const byId = new Map(list.map((border) => [border.crossing_id, border]));
  const top = pinned.flatMap((id) => {
    const found = byId.get(id);
    return found ? [found] : [];
  });
  const topIds = new Set(top.map((border) => border.crossing_id));
  return { pinned: top, rest: list.filter((border) => !topIds.has(border.crossing_id)) };
}
