"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { countryName } from "@/lib/geo/country-name";
import { formatTemplate } from "@/lib/i18n/format-template";
import { unitsFrom } from "@/lib/i18n/units";
import { formatClockDuration } from "@/lib/planner/itinerary";
import { pointsOver, type ComparePoint } from "@/lib/planner/route-compare";
import type { TripPlannerResult } from "@/lib/planner/types";

/**
 * Why the first choice is a good road and, when there is one, why the
 * alternative is worth a thought and what it costs. Numbers only, from the plan.
 */
export function RouteCompare({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const options = plan.route_options;
  if (!options) return null;
  const units = unitsFrom(m);
  const { primary, alternative } = options;

  const word = (point: ComparePoint): string => {
    const text = m.compare[point.code];
    return formatTemplate(text, {
      km: String(point.km ?? ""),
      time: formatClockDuration(point.min ?? 0, units),
      countries: (point.codes ?? []).map((code) => countryName(code, locale)).join(", "),
    });
  };

  const list = (points: ComparePoint[]) =>
    points.length === 0 ? null : (
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-[var(--waze-text-secondary)]">
        {points.map((point) => (
          <li key={point.code}>{word(point)}</li>
        ))}
      </ul>
    );

  if (!alternative) {
    return (
      <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">{m.compare.noAlt}</p>
    );
  }

  const forPrimary = pointsOver(primary, alternative);
  const forAlt = pointsOver(alternative, primary);
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-3">
        <p className="text-sm font-semibold text-[var(--waze-text)]">
          {formatTemplate(m.compare.first, { label: primary.label })}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--waze-text-muted)]">
          {m.compare.whyFirst}
        </p>
        {list(forPrimary) ?? (
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">{m.compare.similar}</p>
        )}
      </div>
      <div className="rounded-xl bg-[var(--waze-surface-elevated)] p-3">
        <p className="text-sm font-semibold text-[var(--waze-text)]">
          {formatTemplate(m.compare.alt, { label: alternative.label })}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--waze-text-muted)]">
          {m.compare.whyAlt}
        </p>
        {list(forAlt) ?? (
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">{m.compare.similar}</p>
        )}
        {forPrimary.length > 0 && (
          <>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[var(--waze-text-muted)]">
              {m.compare.trade}
            </p>
            {list(forPrimary)}
          </>
        )}
      </div>
    </div>
  );
}
