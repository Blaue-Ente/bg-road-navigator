"use client";

import type { ReactNode } from "react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { showAllRoadNotesLabel } from "@/lib/i18n/show-all-labels";
import {
  formatHazardUntil,
  hazardLabel,
  hazardPopupBody,
} from "@/lib/hazards/present";
import { hotspotDetail } from "@/lib/hotspots/present";
import { roadKmDisplay } from "@/lib/hazards/road-km";
import { roadNotesView } from "@/lib/planner/road-notes-view";
import type { TripPlannerResult } from "@/lib/planner/types";

function RoadNoteRow({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-xl bg-[var(--waze-surface-elevated)] p-3 text-sm text-[var(--waze-text)]">
      {children}
    </li>
  );
}

export function PlanRoadNotes({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const hotspots = plan.attention_segments ?? [];
  const hazards = plan.road_hazards ?? [];
  const view = roadNotesView(hotspots, hazards, locale);

  if (view.total === 0) {
    return (
      <section aria-labelledby="plan-road-notes">
        <h3
          id="plan-road-notes"
          className="text-base font-semibold text-[var(--waze-text)]"
        >
          {m.sheet.hazards}
        </h3>
        <p className="mt-2 text-sm text-[var(--waze-text-muted)]">
          {m.sheet.hazardsEmpty}
        </p>
      </section>
    );
  }

  const renderItem = (item: (typeof view.top)[number]) => {
    if (item.kind === "hazard") {
      const hazard = item.hazard;
      const until = formatHazardUntil(hazard.valid_until, locale);
      const label = hazardLabel(hazard.kind, locale);
      const road = roadKmDisplay(hazard.road_km_bg, hazard.text_bg, locale);
      return (
        <RoadNoteRow key={`hazard-${hazard.id}`}>
          <p className="font-medium">
            {label}
            {road ? ` · ${road}` : ""}
          </p>
          <p className="mt-0.5 text-[var(--waze-text-secondary)]">
            {hazardPopupBody(hazard, locale)}
          </p>
          {until ? (
            <p className="mt-1 text-[11px] text-[var(--waze-text-muted)]">
              {m.sheet.hazardsUntil} {until}
            </p>
          ) : null}
        </RoadNoteRow>
      );
    }
    const hotspot = item.hotspot;
    return (
      <RoadNoteRow key={`hotspot-${hotspot.id}`}>
        <p className="font-medium">{m.sheet.attention}</p>
        <p className="mt-0.5 text-[var(--waze-text-secondary)]">
          {hotspotDetail(hotspot, locale)}
        </p>
      </RoadNoteRow>
    );
  };

  return (
    <section aria-labelledby="plan-road-notes">
      <h3
        id="plan-road-notes"
        className="text-base font-semibold text-[var(--waze-text)]"
      >
        {m.sheet.hazards}
      </h3>
      <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
        {view.summary}
      </p>
      <ul className="mt-2 space-y-2">
        {view.top.map((item) => renderItem(item))}
        {view.rest.length === 1 ? view.rest.map((item) => renderItem(item)) : null}
      </ul>
      {view.rest.length > 1 ? (
        <details className="mt-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-[var(--waze-accent-text)]">
            {showAllRoadNotesLabel(view.rest.length, locale)}
          </summary>
          <ul className="mt-2 space-y-2">
            {view.rest.map((item) => renderItem(item))}
          </ul>
        </details>
      ) : null}
      {plan.road_hazard_attribution ? (
        <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">
          {plan.road_hazard_attribution}
        </p>
      ) : null}
      {plan.attention_attribution ? (
        <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">
          {plan.attention_attribution}
        </p>
      ) : null}
    </section>
  );
}

/** @deprecated Use PlanRoadNotes */
export function RoadHazards({ plan }: { plan: TripPlannerResult }) {
  return <PlanRoadNotes plan={plan} />;
}

/** @deprecated Use PlanRoadNotes */
export function AttentionSegments(_props: { plan: TripPlannerResult }) {
  return null;
}