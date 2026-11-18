import type { PlanStop } from "@/lib/planner/types";

export type FuelVerdictReason =
  | "expensive"
  | "dirty"
  | "unsafe"
  | "cheap"
  | "clean"
  | "noPrice";

export interface FuelVerdict {
  verdict: "good" | "ok" | "avoid";
  reasons: FuelVerdictReason[];
}

const NEGATIVE: Array<{ flag: string; reason: FuelVerdictReason }> = [
  { flag: "unsafe", reason: "unsafe" },
  { flag: "dirty", reason: "dirty" },
  { flag: "expensive", reason: "expensive" },
];
const POSITIVE: Array<{ flag: string; reason: FuelVerdictReason }> = [
  { flag: "clean", reason: "clean" },
  { flag: "cheap", reason: "cheap" },
];

/**
 * Whether a planned fuel stop is worth it, from its price colour and what
 * drivers have flagged. No guesses: a stop with no price and no flags is "ok"
 * with the reason that the price is unknown.
 */
export function fuelVerdict(stop: Pick<PlanStop, "price_band" | "flags">): FuelVerdict {
  const weight = (flag: string) =>
    stop.flags.find((item) => item.flag === flag)?.weight ?? 0;
  const reasons: FuelVerdictReason[] = [];
  for (const { flag, reason } of NEGATIVE) {
    if (weight(flag) > 0) reasons.push(reason);
  }
  if (stop.price_band === "red" && !reasons.includes("expensive")) {
    reasons.push("expensive");
  }
  if (reasons.length > 0) return { verdict: "avoid", reasons };

  for (const { flag, reason } of POSITIVE) {
    if (weight(flag) > 0) reasons.push(reason);
  }
  if (stop.price_band === "green" && !reasons.includes("cheap")) {
    reasons.push("cheap");
  }
  if (reasons.length > 0) return { verdict: "good", reasons };
  return {
    verdict: "ok",
    reasons: stop.price_band === "grey" || stop.price_band == null ? ["noPrice"] : [],
  };
}
