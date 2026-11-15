"use client";

import { useState } from "react";
import { BorderWaitBlock } from "@/components/plan/BorderWaitBlock";
import { PlanSafetyBlock } from "@/components/plan/PlanChecklist";
import {
  AttentionSegments,
  RoadHazards,
} from "@/components/plan/PlanRoadNotes";
import { hotspotDetail } from "@/lib/hotspots/present";
import { messages as m } from "@/lib/i18n";
import {
  borderWaitView,
  serbiaHungaryChoices,
} from "@/lib/planner/border-wait-view";
import {
  buildItineraryPoints,
  formatClockDuration,
  type LabeledPoint,
} from "@/lib/planner/itinerary";
import type { ChecklistItem, TripPlannerResult } from "@/lib/planner/types";
import {
  buildMapsHandoff,
  GOOGLE_MAPS_MAX_WAYPOINTS,
  GOOGLE_MAPS_MOBILE_MAX_WAYPOINTS,
  type MapsHandoffPlan,
} from "@/lib/utils/maps-handoff";
import { formatWhen } from "@/components/plan/StopTimeline";

export function PlanItineraryView({
  plan,
  includedIds,
  checks,
  via,
  onToggle = () => undefined,
}: {
  plan: TripPlannerResult;
  includedIds: string[];
  checks: Record<string, boolean>;
  via: LabeledPoint | null;
  onToggle?: (id: string, checked: boolean) => void;
}) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const included = new Set(includedIds);
  const points = buildItineraryPoints({ plan, includedStopIds: included, via });
  const desktop = buildMapsHandoff(points, {
    maxWaypoints: GOOGLE_MAPS_MAX_WAYPOINTS,
  });
  const mobile = buildMapsHandoff(points, {
    maxWaypoints: GOOGLE_MAPS_MOBILE_MAX_WAYPOINTS,
  });
  const stops = plan.stops.filter((stop) => included.has(stop.id));
  const items = checklistItems(plan);
  const done = items.filter((item) => checks[item.id]);
  const left = items.filter((item) => !checks[item.id]);
  const arrival = new Date(
    plan.route.arrive_at ??
      new Date(plan.depart_at).getTime() + plan.route.total_min * 60_000
  );

  const hungaryBorders = serbiaHungaryChoices(
    plan.border.alternatives,
    plan.border.chosen?.border_id ?? null
  );

  const share = async () => {
    const text = shareText(
      plan,
      stops.map((stop) => stop.place_name ?? stop.title),
      done,
      left
    );
    try {
      if (navigator.share) {
        await navigator.share({ title: m.itinerary.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote(m.itinerary.copied);
    } catch {
      setShareNote(m.itinerary.shareFailed);
    }
  };

  return (
    <article className="plan-print-root space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-[var(--waze-text)]">
          {m.itinerary.title}
        </h2>
        <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
          {m.itinerary.lead}
        </p>
        <p className="mt-3 text-lg font-semibold text-[var(--waze-text)]">
          {plan.route.origin.label} → {plan.route.destination.label}
        </p>
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {plan.route.distance_km} {m.planning.km} ·{" "}
          {formatClockDuration(plan.route.duration_min)}{" "}
          {m.sheet.driving.toLowerCase()} ·{" "}
          {formatClockDuration(plan.route.total_min)}{" "}
          {m.sheet.total.toLowerCase()} · {formatWhen(arrival.toISOString())}
        </p>
      </header>

      {plan.border.chosen || hungaryBorders.length > 0 ? (
        <section aria-labelledby="itinerary-border">
          <h3
            id="itinerary-border"
            className="text-sm font-semibold text-[var(--waze-text)]"
          >
            {m.sheet.border}
          </h3>
          {plan.border.chosen ? (
            <BorderWaitBlock chosen={plan.border.chosen} />
          ) : null}
          {hungaryBorders.map((border) => (
            <BorderWaitBlock key={border.border_id} chosen={border} />
          ))}
        </section>
      ) : null}

      <section>
        <h3 className="text-sm font-semibold text-[var(--waze-text)]">
          {m.itinerary.stops}
        </h3>
        {stops.length === 0 ? (
          <p className="mt-1 text-sm text-[var(--waze-text-muted)]">
            {m.sheet.stopsEmpty}
          </p>
        ) : (
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[var(--waze-text)]">
            {stops.map((stop) => (
              <li key={stop.id}>
                <span className="font-medium">
                  {stop.place_name ?? stop.title}
                </span>
                <span className="text-[var(--waze-text-secondary)]">
                  {" "}
                  — {stop.kinds.map((kind) => m.kinds[kind] ?? kind).join(", ")}
                  . {stop.reason}
                </span>
                {stop.kinds.includes("fuel") &&
                  (stop.price_label_bg ? (
                    <span className="block text-[var(--waze-text-secondary)]">
                      {stop.price_label_bg}
                      {stop.price_delta_label_bg
                        ? `. ${stop.price_delta_label_bg}`
                        : ""}
                    </span>
                  ) : (
                    <span className="block text-[var(--waze-text-muted)]">
                      {m.sheet.priceUnknown}
                    </span>
                  ))}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-[var(--waze-text)]">
          {m.itinerary.checks}
        </h3>
        <CheckList
          title={m.itinerary.checks}
          items={done}
          empty={m.itinerary.none}
        />
        <CheckList
          title={m.itinerary.unchecked}
          items={left}
          empty={m.itinerary.none}
        />
      </section>

      <PlanSafetyBlock
        checklist={plan.checklist}
        checks={checks}
        onToggle={onToggle}
      />
      <RoadHazards plan={plan} />
      <AttentionSegments plan={plan} />

      {plan.warnings.length > 0 && (
        <ul className="space-y-1 text-sm text-[var(--waze-warning)]">
          {plan.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      <div className="plan-no-print flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="waze-btn-secondary px-4 py-2 text-sm"
        >
          {m.itinerary.print}
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="waze-btn-secondary px-4 py-2 text-sm"
        >
          {m.itinerary.share}
        </button>
      </div>
      {shareNote && (
        <p
          className="plan-no-print text-sm text-[var(--waze-text-secondary)]"
          role="status"
        >
          {shareNote}
        </p>
      )}

      <section className="plan-no-print" aria-label={m.itinerary.export}>
        <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
          {m.itinerary.export}
        </h3>
        <div className="flex flex-wrap gap-2 max-md:hidden">
          <HandoffLinks plan={desktop} />
        </div>
        <div className="flex flex-wrap gap-2 md:hidden">
          <HandoffLinks plan={mobile} />
        </div>
      </section>
    </article>
  );
}

function CheckList({
  title,
  items,
  empty,
}: {
  title: string;
  items: ChecklistItem[];
  empty: string;
}) {
  return (
    <div className="mt-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--waze-text-muted)]">{empty}</p>
      ) : (
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--waze-text)]">
          {items.map((item) => (
            <li key={item.id}>{item.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HandoffLinks({ plan }: { plan: MapsHandoffPlan }) {
  const several = plan.legs.length > 1;
  return (
    <>
      {plan.legs.map((leg, index) => (
        <a
          key={`google-${index}`}
          href={leg.googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-secondary px-3 py-2 text-sm"
        >
          {m.itinerary.google}
          {several ? ` — ${m.itinerary.leg} ${index + 1}` : ""}
        </a>
      ))}
      {plan.legs.map((leg, index) => (
        <a
          key={`apple-${index}`}
          href={leg.appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-secondary px-3 py-2 text-sm"
        >
          {m.itinerary.apple}
          {several ? ` — ${m.itinerary.leg} ${index + 1}` : ""}
        </a>
      ))}
      {plan.wazeStops.map((stop, index) => (
        <a
          key={`waze-${index}`}
          href={stop.url}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-secondary px-3 py-2 text-sm"
        >
          {m.itinerary.waze}
          {stop.label ? ` — ${stop.label}` : ""}
        </a>
      ))}
    </>
  );
}

function borderShareLine(plan: TripPlannerResult): string {
  const chosen = plan.border.chosen;
  if (!chosen) return "";
  const view = borderWaitView(chosen.wait);
  const wait = view.unlicensed
    ? `${chosen.name_bg}: ${m.sheet.borderUnlicensed}, ${view.minutes} ${m.prefs.minutes}`
    : `${chosen.name_bg}: ${view.minutes} ${m.prefs.minutes}`;
  if (view.trafficDelayMin == null) return wait;
  return `${wait}. ${m.sheet.borderTraffic}: ${view.trafficDelayMin} ${m.prefs.minutes}`;
}

function checklistItems(plan: TripPlannerResult): ChecklistItem[] {
  return [
    ...plan.checklist.vignettes,
    ...plan.checklist.toll_sections,
    ...plan.checklist.documents,
    ...plan.checklist.winter,
    ...plan.checklist.kit,
  ];
}

function shareText(
  plan: TripPlannerResult,
  stopNames: string[],
  done: ChecklistItem[],
  left: ChecklistItem[]
): string {
  return [
    `${m.itinerary.title}: ${plan.route.origin.label} → ${plan.route.destination.label}`,
    `${plan.route.distance_km} ${m.planning.km}, ${formatClockDuration(plan.route.duration_min)}, ${formatClockDuration(plan.route.total_min)}`,
    borderShareLine(plan),
    stopNames.length ? `${m.itinerary.stops}: ${stopNames.join(", ")}` : "",
    done.length
      ? `${m.itinerary.checks}: ${done.map((item) => item.title).join(", ")}`
      : "",
    left.length
      ? `${m.itinerary.unchecked}: ${left.map((item) => item.title).join(", ")}`
      : "",
    ...(plan.checklist.safety ?? []).map(
      (item) => `${item.title}: ${item.detail}`
    ),
    plan.checklist.safety_closing ?? "",
    ...(plan.attention_segments ?? []).map((hotspot) => hotspotDetail(hotspot)),
  ]
    .filter(Boolean)
    .join("\n");
}
