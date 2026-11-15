import { formatHazardUntil, hazardsForSheet } from "@/lib/hazards/present";
import {
  ATTENTION_TITLE,
  hotspotDetail,
  hotspotsForSheet,
} from "@/lib/hotspots/present";
import { messages as m } from "@/lib/i18n";
import type { TripPlannerResult } from "@/lib/planner/types";

export function RoadHazards({ plan }: { plan: TripPlannerResult }) {
  const hazards = hazardsForSheet(plan.road_hazards ?? []);
  return (
    <section aria-labelledby="plan-hazards">
      <h3
        id="plan-hazards"
        className="text-base font-semibold text-[var(--waze-text)]"
      >
        {m.sheet.hazards}
      </h3>
      {hazards.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--waze-text-muted)]">
          {m.sheet.hazardsEmpty}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {hazards.map((hazard) => {
            const until = formatHazardUntil(hazard.valid_until);
            return (
              <li
                key={hazard.id}
                className="rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]"
              >
                <p className="font-medium">
                  {hazard.label_bg}
                  {hazard.road_km_bg ? ` · ${hazard.road_km_bg}` : ""}
                </p>
                <p className="mt-0.5 text-[var(--waze-text-secondary)]">
                  {hazard.text_bg}
                </p>
                {until && (
                  <p className="mt-1 text-[11px] text-[var(--waze-text-muted)]">
                    {m.sheet.hazardsUntil} {until}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {plan.road_hazard_attribution && (
        <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">
          {plan.road_hazard_attribution}
        </p>
      )}
    </section>
  );
}

export function AttentionSegments({ plan }: { plan: TripPlannerResult }) {
  const segments = hotspotsForSheet(plan.attention_segments ?? []);
  if (segments.length === 0) return null;
  const hidden = (plan.attention_segments?.length ?? 0) - segments.length;
  return (
    <section aria-labelledby="plan-attention">
      <h3
        id="plan-attention"
        className="text-base font-semibold text-[var(--waze-text)]"
      >
        {ATTENTION_TITLE}
      </h3>
      <ul className="mt-2 space-y-2">
        {segments.map((hotspot) => (
          <li
            key={hotspot.id}
            className="rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]"
          >
            <p className="font-medium">{m.sheet.attention}</p>
            <p className="mt-0.5 text-[var(--waze-text-secondary)]">
              {hotspotDetail(hotspot)}
            </p>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">
          Още {hidden} участъка по маршрута.
        </p>
      )}
      {plan.attention_attribution && (
        <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">
          {plan.attention_attribution}
        </p>
      )}
    </section>
  );
}
