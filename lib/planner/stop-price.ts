import type { PlanPrice, PlanStop } from "@/lib/planner/types";

/** Station copy only — country averages live on the plan sheet, not on the stop. */
export function stopPriceCopy(stop: {
  price: PlanPrice | null;
  kinds: PlanStop["kinds"];
  price_note?: string | null;
}): "station" | "unknown" | "none" {
  if (stop.kinds.includes("fuel")) {
    if (stop.price) return "station";
    return "unknown";
  }
  if (stop.price) return "station";
  if (stop.price_note === "price unknown") return "unknown";
  return "none";
}