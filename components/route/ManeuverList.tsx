"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { formatTemplate } from "@/lib/i18n/format-template";

import type { RouteManeuver } from "@/types/route.types";

export function ManeuverList({ maneuvers }: { maneuvers: RouteManeuver[] }) {
  const m = useMessages();

  if (!maneuvers.length) {
    return (
      <p className="text-xs text-[var(--waze-text-muted)]">
        {m.routePage.maneuversEmpty}
      </p>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
        {formatTemplate(m.routePage.maneuversTitle, { count: maneuvers.length })}
      </h3>
      <p className="mb-2 text-xs text-[var(--waze-text-muted)]">
        {m.routePage.maneuversHint}
      </p>
      <ol className="max-h-56 space-y-1 overflow-y-auto text-sm">
        {maneuvers.slice(0, 40).map((step, index) => (
          <li
            key={`${step.type}-${index}-${step.distance_m}`}
            className="rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            <span className="text-[var(--waze-text-muted)]">{index + 1}. </span>
            {step.instruction_bg}
            {step.distance_m > 0 && (
              <span className="ml-1 text-xs text-[var(--waze-text-muted)]">
                ·{" "}
                {step.distance_m >= 1000
                  ? `${(step.distance_m / 1000).toFixed(1)} ${m.units.km}`
                  : `${step.distance_m} ${m.routePage.meterShort}`}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}