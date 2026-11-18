"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { formatWhen } from "@/components/plan/StopTimeline";
import { formatTemplate } from "@/lib/i18n/format-template";
import { unitsFrom } from "@/lib/i18n/units";
import type { DriverPlan } from "@/lib/planner/driver-plan";
import { formatClockDuration } from "@/lib/planner/itinerary";

/** Who drives when, for a trip where the drivers swap through the night. */
export function DriverPlanView({ plan }: { plan: DriverPlan }) {
  const m = useMessages();
  const units = unitsFrom(m);
  return (
    <section aria-labelledby="plan-drivers" className="space-y-2">
      <div>
        <h3 id="plan-drivers" className="text-base font-semibold text-[var(--waze-text)]">
          {m.driverPlan.title}
        </h3>
        <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
          {formatTemplate(m.driverPlan.intro, { stint: String(plan.stint_min) })}
        </p>
      </div>
      <ol className="space-y-1.5 text-sm text-[var(--waze-text)]">
        {plan.turns.map((turn) => (
          <li
            key={`${turn.from_eta}-${turn.driver}`}
            className="rounded-lg bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            <span className="font-semibold">
              {formatTemplate(m.driverPlan.turn, {
                driver: String(turn.driver),
                from: turn.from_label,
                until: turn.until_label,
                drive: formatClockDuration(turn.driving_min, units),
              })}
            </span>
            <span className="block text-xs text-[var(--waze-text-muted)]">
              {formatWhen(turn.from_eta)} → {formatWhen(turn.until_eta)}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-[var(--waze-text)]">
        {formatTemplate(m.driverPlan.total, {
          list: plan.per_driver_min
            .map((min, index) =>
              formatTemplate(m.driverPlan.perDriver, {
                driver: String(index + 1),
                drive: formatClockDuration(min, units),
              })
            )
            .join(", "),
        })}
      </p>
      <p className="text-xs text-[var(--waze-text-muted)]">{m.driverPlan.note}</p>
    </section>
  );
}
