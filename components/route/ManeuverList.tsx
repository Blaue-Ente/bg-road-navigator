"use client";

import type { RouteManeuver } from "@/types/route.types";

export function ManeuverList({ maneuvers }: { maneuvers: RouteManeuver[] }) {
  if (!maneuvers.length) {
    return (
      <p className="text-xs text-[var(--waze-text-muted)]">
        Списък с маневри е наличен при OSRM маршрут. Жива навигация в
        приложението още не е включена — стартирайте Google/Apple Maps.
      </p>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
        Маневри ({maneuvers.length})
      </h3>
      <p className="mb-2 text-xs text-[var(--waze-text-muted)]">
        Подготовка за turn-by-turn. Live guidance в приложението не е активен.
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
                  ? `${(step.distance_m / 1000).toFixed(1)} км`
                  : `${step.distance_m} м`}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
