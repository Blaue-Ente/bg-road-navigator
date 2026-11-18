import type { TripLog } from "@/lib/db/schema";

export const EXPENSE_CATEGORIES = [
  "fuel",
  "vignette",
  "tolls",
  "bridge",
  "lodging",
  "meals",
  "coffee",
  "other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface LedgerSummary {
  spent: number;
  byCategory: Record<string, number>;
  /** The estimate made with the plan, when there is one. */
  estimateTotal: number | null;
  estimateByCategory: Record<string, number>;
  /** Spent minus estimated; null without an estimate. */
  difference: number | null;
  drivenKm: number | null;
  /** Fuel spent per 100 km driven, when both are known. */
  fuelPer100: number | null;
}

const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/** What the trip really cost against what was expected, and what the car really used. */
export function summarizeLedger(log: TripLog | null | undefined): LedgerSummary {
  const expenses = log?.expenses ?? [];
  const byCategory: Record<string, number> = {};
  for (const expense of expenses) {
    byCategory[expense.category] = round((byCategory[expense.category] ?? 0) + expense.amount_eur, 2);
  }
  const spent = round(expenses.reduce((sum, expense) => sum + expense.amount_eur, 0), 2);

  const estimateByCategory: Record<string, number> = {};
  for (const line of log?.estimate?.lines ?? []) {
    if (line.eur == null) continue;
    estimateByCategory[line.id] = round((estimateByCategory[line.id] ?? 0) + line.eur, 2);
  }
  const estimateTotal = log?.estimate ? round(log.estimate.total_eur) : null;

  const start = log?.odometer_start_km ?? null;
  const end = log?.odometer_end_km ?? null;
  const drivenKm = start != null && end != null && end > start ? round(end - start) : null;
  const fuelSpent = byCategory.fuel ?? 0;
  return {
    spent,
    byCategory,
    estimateTotal,
    estimateByCategory,
    difference: estimateTotal != null && spent > 0 ? round(spent - estimateTotal, 2) : null,
    drivenKm,
    fuelPer100: drivenKm != null && fuelSpent > 0 ? round((fuelSpent / drivenKm) * 100, 2) : null,
  };
}
