"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useMessages } from "@/components/i18n/LocaleProvider";
import {
  EXPENSE_CATEGORIES,
  summarizeLedger,
  type ExpenseCategory,
} from "@/lib/costs/ledger";
import type { ChecklistRow } from "@/lib/db/checklists";
import type { TripLog } from "@/lib/db/schema";
import { formatTemplate } from "@/lib/i18n/format-template";

type Expense = NonNullable<TripLog["expenses"]>[number];

function numberOrNull(value: string): number | null {
  const parsed = Number(value.replace(",", "."));
  return value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : null;
}

/** Odometer and real spending of one trip, set against the estimate made with its plan. */
export function TripLedger({
  row,
  onSaved,
}: {
  row: ChecklistRow;
  onSaved: (log: TripLog) => void;
}) {
  const m = useMessages();
  const log = row.trip_log;
  const [start, setStart] = useState(log?.odometer_start_km?.toString() ?? "");
  const [end, setEnd] = useState(log?.odometer_end_km?.toString() ?? "");
  const [expenses, setExpenses] = useState<Expense[]>(log?.expenses ?? []);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">(
    "idle"
  );

  const draft: TripLog = {
    ...(log ?? {}),
    odometer_start_km: numberOrNull(start),
    odometer_end_km: numberOrNull(end),
    expenses: expenses.filter((expense) => expense.amount_eur > 0),
  };
  const summary = summarizeLedger(draft);
  const categoryLabel: Record<ExpenseCategory, string> = {
    fuel: m.ledger.cat.fuel,
    vignette: m.ledger.cat.vignette,
    tolls: m.ledger.cat.tolls,
    bridge: m.ledger.cat.bridge,
    lodging: m.ledger.cat.lodging,
    meals: m.ledger.cat.meals,
    coffee: m.ledger.cat.coffee,
    other: m.ledger.cat.other,
  };

  const save = async () => {
    setState("saving");
    const response = await fetch(`/api/checklists/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trip_log: {
          odometer_start_km: draft.odometer_start_km,
          odometer_end_km: draft.odometer_end_km,
          expenses: draft.expenses,
        },
      }),
    }).catch(() => null);
    if (response?.ok) {
      setState("saved");
      onSaved(draft);
    } else setState("failed");
  };

  const input =
    "focus-ring mt-1 min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2 text-sm";

  return (
    <div className="space-y-3 border-t border-[var(--waze-border)] pt-3">
      <div>
        <h3 className="text-sm font-semibold text-[var(--waze-text)]">
          {m.ledger.title}
        </h3>
        <p className="text-xs text-[var(--waze-text-muted)]">{m.ledger.hint}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-[var(--waze-text-secondary)]">
          {m.ledger.odoStart}
          <input
            inputMode="numeric"
            value={start}
            onChange={(event) =>
              setStart(event.target.value.replace(/[^\d]/g, ""))
            }
            className={input}
          />
        </label>
        <label className="block text-xs text-[var(--waze-text-secondary)]">
          {m.ledger.odoEnd}
          <input
            inputMode="numeric"
            value={end}
            onChange={(event) =>
              setEnd(event.target.value.replace(/[^\d]/g, ""))
            }
            className={input}
          />
        </label>
      </div>
      {summary.drivenKm != null && (
        <p className="text-sm font-medium text-[var(--waze-text)]">
          {formatTemplate(m.ledger.driven, { km: String(summary.drivenKm) })}
        </p>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
          {m.ledger.expenses}
        </h4>
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="grid grid-cols-[1fr_6rem_auto] items-end gap-2"
          >
            <select
              value={expense.category}
              onChange={(event) =>
                setExpenses((list) =>
                  list.map((item) =>
                    item.id === expense.id
                      ? { ...item, category: event.target.value }
                      : item
                  )
                )
              }
              aria-label={m.ledger.expenses}
              className={input}
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {categoryLabel[category]}
                </option>
              ))}
            </select>
            <input
              inputMode="decimal"
              value={expense.amount_eur === 0 ? "" : String(expense.amount_eur)}
              placeholder={m.ledger.amount}
              aria-label={m.ledger.amount}
              onChange={(event) =>
                setExpenses((list) =>
                  list.map((item) =>
                    item.id === expense.id
                      ? {
                          ...item,
                          amount_eur: numberOrNull(event.target.value) ?? 0,
                        }
                      : item
                  )
                )
              }
              className={input}
            />
            <button
              type="button"
              onClick={() =>
                setExpenses((list) =>
                  list.filter((item) => item.id !== expense.id)
                )
              }
              aria-label={m.ledger.remove}
              className="grid h-11 w-11 place-items-center rounded-full text-[var(--waze-danger)]"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setExpenses((list) => [
              ...list,
              {
                id: `e-${Date.now().toString(36)}-${list.length}`,
                category: "fuel",
                amount_eur: 0,
              },
            ])
          }
          className="waze-btn-secondary inline-flex min-h-11 items-center gap-2 px-4 text-sm"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {m.ledger.add}
        </button>
      </div>

      {summary.spent > 0 && (
        <div className="rounded-xl bg-[var(--waze-surface)] p-3 text-sm text-[var(--waze-text)]">
          <p className="font-semibold">
            {summary.estimateTotal != null
              ? formatTemplate(m.ledger.spent, {
                  spent: String(Math.round(summary.spent)),
                  estimate: String(summary.estimateTotal),
                })
              : formatTemplate(m.ledger.spentOnly, {
                  spent: String(Math.round(summary.spent)),
                })}
          </p>
          {summary.difference != null && (
            <p className="text-[var(--waze-text-secondary)]">
              {summary.difference > 0
                ? formatTemplate(m.ledger.over, {
                    diff: String(Math.round(summary.difference)),
                  })
                : formatTemplate(m.ledger.under, {
                    diff: String(Math.round(Math.abs(summary.difference))),
                  })}
            </p>
          )}
          {summary.fuelPer100 != null && (
            <p className="text-[var(--waze-text-secondary)]">
              {formatTemplate(m.ledger.per100, {
                price: String(summary.fuelPer100),
              })}
            </p>
          )}
          <ul className="mt-1 space-y-0.5 text-xs text-[var(--waze-text-secondary)]">
            {Object.entries(summary.byCategory).map(([category, spent]) => (
              <li key={category}>
                {categoryLabel[category as ExpenseCategory] ?? category}:{" "}
                {Math.round(spent)} €
                {summary.estimateByCategory[category] != null
                  ? ` (${summary.estimateByCategory[category]} €)`
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={state === "saving"}
          className="waze-btn-primary min-h-11 px-4 text-sm disabled:opacity-50"
        >
          {m.ledger.save}
        </button>
        {state === "saved" && (
          <span className="text-xs text-[var(--waze-text-secondary)]">
            {m.ledger.saved}
          </span>
        )}
        {state === "failed" && (
          <span className="text-xs text-[var(--waze-danger)]">
            {m.ledger.saveFailed}
          </span>
        )}
      </div>
    </div>
  );
}
