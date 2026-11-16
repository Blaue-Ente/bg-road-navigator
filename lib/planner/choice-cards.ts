import type { RouteOptionSummary, RouteOptionsBlock } from "@/lib/planner/types";

export function optionChoiceKey(option: RouteOptionSummary): string {
  return option.border_id ?? option.source;
}

/** Stable card order when the user switches primary/alternative. */
export function orderChoiceCards(
  options: RouteOptionsBlock,
  previousOrderKeys: string[] | null
): RouteOptionSummary[] {
  const cards: RouteOptionSummary[] = [options.primary];
  if (options.alternative) cards.push(options.alternative);
  const keys = cards.map(optionChoiceKey);
  if (
    previousOrderKeys &&
    previousOrderKeys.length === keys.length &&
    keys.every((key) => previousOrderKeys.includes(key))
  ) {
    return previousOrderKeys
      .map((key) => cards.find((card) => optionChoiceKey(card) === key))
      .filter((card): card is RouteOptionSummary => card != null);
  }
  return cards;
}

export function choiceCardOrderKeysFromOptions(
  options: RouteOptionsBlock,
  previousOrderKeys: string[] | null
): string[] {
  return orderChoiceCards(options, previousOrderKeys).map(optionChoiceKey);
}

export type ChoicePickState = {
  pendingId: string | null;
  switchFailed: boolean;
};

export type ChoicePickAction =
  | { type: "pick"; id: string }
  | { type: "success" }
  | { type: "failure" }
  | { type: "reset" };

export function choicePickReducer(
  state: ChoicePickState,
  action: ChoicePickAction
): ChoicePickState {
  switch (action.type) {
    case "pick":
      return { pendingId: action.id, switchFailed: false };
    case "success":
      return { pendingId: null, switchFailed: false };
    case "failure":
      return { pendingId: null, switchFailed: true };
    case "reset":
      return { pendingId: null, switchFailed: false };
    default:
      return state;
  }
}