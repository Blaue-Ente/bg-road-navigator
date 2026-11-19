import { describe, expect, it } from "vitest";
import {
  EMPTY_BORDER_FILTER,
  busyLevel,
  countriesInList,
  countriesOf,
  neighboursOf,
  filterBorders,
  splitPinned,
} from "@/lib/borders/list-view";
import type { BorderStatus } from "@/types/border.types";

function border(id: string, pair: string, wait: number): BorderStatus {
  return {
    crossing_id: id,
    name_bg: id,
    name_en: id,
    country_pair: pair,
    wait_time_cars: wait,
    wait_time_trucks: 0,
    wait_time_buses: 0,
    avg_wait_by_hour: [],
    working_hours: "24/7",
    status: "green",
    last_updated: "",
  };
}

const LIST = [
  border("kalotina", "BG - RS", 60),
  border("kulata", "BG - GR", 10),
  border("ruse", "BG - RO", 30),
  border("promachon", "BG - GR", 20),
];

describe("border list view", () => {
  it("reads countries from a pair and from a list", () => {
    expect(countriesOf("BG - RS")).toEqual(["BG", "RS"]);
    expect(countriesInList(LIST)).toEqual(["BG", "GR", "RO", "RS"]);
  });

  it("finds the neighbours of a country and filters a pair of countries", () => {
    expect(neighboursOf(LIST, "BG")).toEqual(["GR", "RO", "RS"]);
    expect(neighboursOf(LIST, "GR")).toEqual(["BG"]);
    const pair = filterBorders(LIST, { ...EMPTY_BORDER_FILTER, country: "BG", neighbour: "GR" });
    expect(pair.map((b) => b.crossing_id)).toEqual(["kulata", "promachon"]);
  });

  it("sorts waits into light, medium and heavy", () => {
    expect(busyLevel(15)).toBe("light");
    expect(busyLevel(16)).toBe("medium");
    expect(busyLevel(45)).toBe("medium");
    expect(busyLevel(46)).toBe("heavy");
  });

  it("filters by country and by busyness, and sorts by wait", () => {
    expect(filterBorders(LIST, { ...EMPTY_BORDER_FILTER, country: "GR" }).map((b) => b.crossing_id)).toEqual([
      "kulata",
      "promachon",
    ]);
    expect(filterBorders(LIST, { ...EMPTY_BORDER_FILTER, busy: "heavy" }).map((b) => b.crossing_id)).toEqual([
      "kalotina",
    ]);
    expect(filterBorders(LIST, { ...EMPTY_BORDER_FILTER, sort: "wait" }).map((b) => b.crossing_id)).toEqual([
      "kulata",
      "promachon",
      "ruse",
      "kalotina",
    ]);
  });

  it("puts pinned crossings first in the order they were pinned", () => {
    const split = splitPinned(LIST, ["ruse", "kulata", "gone"]);
    expect(split.pinned.map((b) => b.crossing_id)).toEqual(["ruse", "kulata"]);
    expect(split.rest.map((b) => b.crossing_id)).toEqual(["kalotina", "promachon"]);
  });
});
