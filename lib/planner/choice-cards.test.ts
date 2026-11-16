import { describe, expect, it } from "vitest";
import {
  choicePickReducer,
  optionChoiceKey,
  orderChoiceCards,
} from "@/lib/planner/choice-cards";
import type { RouteOptionSummary, RouteOptionsBlock } from "@/lib/planner/types";

function option(
  partial: Partial<RouteOptionSummary> & Pick<RouteOptionSummary, "role" | "source">
): RouteOptionSummary {
  return {
    id: partial.role,
    role: partial.role,
    source: partial.source,
    border_id: partial.border_id ?? null,
    label: partial.label ?? partial.border_id ?? partial.source,
    distance_km: partial.distance_km ?? 100,
    drive_min: partial.drive_min ?? 60,
    wait_min: partial.wait_min ?? 0,
    total_min: partial.total_min ?? 60,
    countries: partial.countries ?? [],
    vignette_codes: partial.vignette_codes ?? [],
    toll_codes: partial.toll_codes ?? [],
    geometry: partial.geometry ?? { type: "LineString", coordinates: [] },
  };
}

function block(
  primary: RouteOptionSummary,
  alternative: RouteOptionSummary | null
): RouteOptionsBlock {
  return {
    primary,
    alternative,
    unavailable_reason: alternative ? null : "no_divergent_path",
  };
}

describe("orderChoiceCards", () => {
  it("keeps kalotina before vidin when primary flips to vidin", () => {
    const kalotina = option({
      role: "primary",
      source: "border",
      border_id: "kalotina",
    });
    const vidin = option({
      role: "alternative",
      source: "border",
      border_id: "vidin",
    });
    const first = orderChoiceCards(block(kalotina, vidin), null);
    expect(first.map(optionChoiceKey)).toEqual(["kalotina", "vidin"]);

    const vidinPrimary = option({ ...vidin, role: "primary", id: "primary" });
    const kalotinaAlt = option({ ...kalotina, role: "alternative", id: "alternative" });
    const second = orderChoiceCards(
      block(vidinPrimary, kalotinaAlt),
      ["kalotina", "vidin"]
    );
    expect(second.map(optionChoiceKey)).toEqual(["kalotina", "vidin"]);
  });

  it("returns primary-first order for a new pair", () => {
    const a = option({ role: "primary", source: "border", border_id: "kulata" });
    const b = option({ role: "alternative", source: "border", border_id: "lesovo" });
    expect(orderChoiceCards(block(a, b), ["kalotina", "vidin"]).map(optionChoiceKey)).toEqual([
      "kulata",
      "lesovo",
    ]);
  });
});

describe("choicePickReducer", () => {
  it("tracks pending and failure", () => {
    let state = choicePickReducer(
      { pendingId: null, switchFailed: false },
      { type: "pick", id: "vidin" }
    );
    expect(state.pendingId).toBe("vidin");
    state = choicePickReducer(state, { type: "failure" });
    expect(state).toEqual({ pendingId: null, switchFailed: true });
    state = choicePickReducer(state, { type: "pick", id: "kalotina" });
    state = choicePickReducer(state, { type: "success" });
    expect(state).toEqual({ pendingId: null, switchFailed: false });
  });
});