"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { WeatherGlyphIcon } from "@/components/weather/WeatherGlyph";
import { BorderWaitBlock } from "@/components/plan/BorderWaitBlock";
import { serbiaHungaryChoices } from "@/lib/planner/border-wait-view";
import { FuelPriceLegend } from "@/components/plan/FuelPriceLegend";
import { PlanChecklist } from "@/components/plan/PlanChecklist";
import { PlanItineraryView } from "@/components/plan/PlanItineraryView";
import { formatWhen, StopTimeline } from "@/components/plan/StopTimeline";
import { useDialogFocus } from "@/components/plan/useDialogFocus";
import {
  AttentionSegments,
  RoadHazards,
} from "@/components/plan/PlanRoadNotes";
import {
  currentLocationPreference,
  locationPreferenceServerSnapshot,
  locationPreferenceSnapshot,
  subscribeLocationPreference,
} from "@/lib/location/browser-pref";
import { useTripSessionStore } from "@/lib/stores/trip-session.store";
import { messages as m } from "@/lib/i18n";
import {
  checklistStorageKey,
  defaultIncludedStops,
  formatClockDuration,
  whySummary,
} from "@/lib/planner/itinerary";
import type { TripPlannerResult } from "@/lib/planner/types";
import { useRouteStore } from "@/lib/stores/route.store";
import { wmoToWeather } from "@/lib/utils/weather-codes";

export function PlanDetailSheet() {
  const open = useRouteStore((state) => state.planDetailOpen);
  const plan = useRouteStore((state) => state.tripPlan);
  const via = useRouteStore((state) => state.planningVia);
  const focusedStopId = useRouteStore((state) => state.focusedStopId);
  const setOpen = useRouteStore((state) => state.setPlanDetailOpen);
  const [minimized, setMinimized] = useState(false);
  const [view, setView] = useState<"detail" | "itinerary">("detail");
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [snapshot, setSnapshot] = useState<{
    includedIds: string[];
    checks: Record<string, boolean>;
  } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stamp = plan?.generated_at ?? "";

  useDialogFocus(open && !minimized && Boolean(plan), dialogRef, () => {
    if (view === "itinerary") setView("detail");
    else setOpen(false);
  });

  useEffect(() => {
    const current = useRouteStore.getState().tripPlan;
    if (!current) return;
    setView("detail");
    setSnapshot(null);
    setIncluded(defaultIncludedStops(current.stops));
    setChecks(readChecks(checklistStorageKey(current)));
    setMinimized(false);
  }, [stamp]);

  useEffect(() => {
    if (focusedStopId) setMinimized(false);
  }, [focusedStopId]);

  useEffect(() => {
    if (!open || minimized) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open, minimized]);

  useEffect(() => {
    if (!focusedStopId || view !== "detail" || minimized) return;
    const node = document.getElementById(`plan-stop-${focusedStopId}`);
    node?.scrollIntoView({ block: "center" });
    if (node instanceof HTMLElement) node.focus();
  }, [focusedStopId, view, minimized, stamp]);

  if (!open || !plan) return null;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="pointer-events-auto fixed z-40 rounded-full bg-[var(--waze-accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg right-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6"
      >
        {m.sheet.showPlan}
      </button>
    );
  }

  const arrival = new Date(
    new Date(plan.depart_at).getTime() + plan.route.total_min * 60_000
  );
  const summary = whySummary(plan.why_this_route);

  const toggleCheck = (id: string, checked: boolean) => {
    const next = { ...checks, [id]: checked };
    setChecks(next);
    try {
      localStorage.setItem(checklistStorageKey(plan), JSON.stringify(next));
    } catch {
      // Private mode can reject storage. The boxes still work for this visit.
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-sheet-title"
        className="plan-sheet pointer-events-auto absolute inset-0 flex flex-col overflow-y-auto bg-[var(--waze-bg)] shadow-2xl md:inset-y-3 md:right-3 md:left-auto md:w-[min(44rem,calc(100vw-24rem))] md:rounded-3xl md:border md:border-[var(--waze-border)]"
      >
        <div className="sticky top-0 z-10 border-b border-[var(--waze-border)] bg-[var(--waze-surface)] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <h2
              id="plan-sheet-title"
              className="text-lg font-semibold text-[var(--waze-text)]"
            >
              {view === "itinerary" ? m.itinerary.title : m.sheet.title}
            </h2>
            <div className="plan-no-print flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setMinimized(true)}
                className="waze-btn-secondary px-3 py-1.5 text-xs"
              >
                {m.sheet.showMap}
              </button>
              <button
                type="button"
                data-autofocus
                onClick={() => setOpen(false)}
                className="waze-btn-secondary px-3 py-1.5 text-xs"
              >
                {m.sheet.close}
              </button>
            </div>
          </div>
          <p className="mt-2 font-medium text-[var(--waze-text)]">
            {plan.route.origin.label} → {plan.route.destination.label}
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <Stat
              label={m.sheet.distance}
              value={`${plan.route.distance_km} ${m.planning.km}`}
            />
            <Stat
              label={m.sheet.driving}
              value={formatClockDuration(plan.route.duration_min)}
            />
            <Stat
              label={m.sheet.total}
              value={formatClockDuration(plan.route.total_min)}
            />
            <Stat
              label={m.sheet.eta}
              value={formatWhen(arrival.toISOString())}
            />
          </dl>
          <TripMode />
        </div>

        <div className="space-y-6 px-4 py-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          {view === "itinerary" && snapshot ? (
            <>
              <button
                type="button"
                onClick={() => setView("detail")}
                className="plan-no-print text-sm text-[var(--waze-accent-text)] underline"
              >
                {m.sheet.back}
              </button>
              <PlanItineraryView
                plan={plan}
                includedIds={snapshot.includedIds}
                checks={snapshot.checks}
                via={via}
                onToggle={(id, checked) => {
                  toggleCheck(id, checked);
                  setSnapshot((current) =>
                    current
                      ? {
                          ...current,
                          checks: { ...current.checks, [id]: checked },
                        }
                      : current
                  );
                }}
              />
            </>
          ) : (
            <DetailBody
              plan={plan}
              summary={summary}
              included={included}
              onToggleStop={(id, next) =>
                setIncluded((current) => ({ ...current, [id]: next }))
              }
              focusedStopId={focusedStopId}
              checks={checks}
              onToggleCheck={toggleCheck}
              onCreate={() => {
                setSnapshot({
                  includedIds: plan.stops
                    .filter((stop) => included[stop.id] !== false)
                    .map((stop) => stop.id),
                  checks,
                });
                setView("itinerary");
              }}
            />
          )}
          <p className="text-[11px] text-[var(--waze-text-muted)]">
            <a
              href={plan.attribution.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {plan.attribution.text}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function TripMode() {
  const active = useTripSessionStore((state) => state.active);
  const start = useTripSessionStore((state) => state.start);
  const stop = useTripSessionStore((state) => state.stop);
  const raw = useSyncExternalStore(
    subscribeLocationPreference,
    locationPreferenceSnapshot,
    locationPreferenceServerSnapshot
  );
  const locationOn = raw ? currentLocationPreference().location_opt_in : false;
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => (active ? stop() : start())}
        className="plan-no-print rounded-full bg-[var(--waze-accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        {active ? m.sheet.endTrip : m.sheet.onTrip}
      </button>
      {active && !locationOn && (
        <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
          {m.sheet.tripNeedsLocation}
        </p>
      )}
    </div>
  );
}

function DetailBody({
  plan,
  summary,
  included,
  onToggleStop,
  focusedStopId,
  checks,
  onToggleCheck,
  onCreate,
}: {
  plan: TripPlannerResult;
  summary: string;
  included: Record<string, boolean>;
  onToggleStop: (id: string, included: boolean) => void;
  focusedStopId: string | null;
  checks: Record<string, boolean>;
  onToggleCheck: (id: string, checked: boolean) => void;
  onCreate: () => void;
}) {
  const chosen = plan.border.chosen;
  return (
    <>
      <section aria-labelledby="why-route">
        <h3
          id="why-route"
          className="text-base font-semibold text-[var(--waze-text)]"
        >
          {m.sheet.why}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
          {summary || m.sheet.whyEmpty}
        </p>
      </section>

      <section aria-labelledby="plan-weather">
        <h3
          id="plan-weather"
          className="text-base font-semibold text-[var(--waze-text)]"
        >
          {m.sheet.weather}
        </h3>
        {plan.weather.warnings.length > 0 && (
          <ul className="mt-2 space-y-2">
            {plan.weather.warnings.map((warning) => (
              <li
                key={`${warning.source}-${warning.title}`}
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--waze-warning)]"
              >
                <p className="font-medium">{warning.title}</p>
                <p>{warning.detail}</p>
              </li>
            ))}
          </ul>
        )}
        {plan.weather.segments.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--waze-text-muted)]">
            {m.sheet.weatherEmpty}
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {plan.weather.segments.map((segment) => {
              const glyph =
                segment.weather_code == null
                  ? "unknown"
                  : wmoToWeather(segment.weather_code).icon;
              return (
                <li
                  key={`${segment.eta}-${segment.distance_from_start_km}`}
                  className="flex items-start gap-3 rounded-xl bg-[var(--waze-surface-elevated)] p-3"
                >
                  <WeatherGlyphIcon
                    name={glyph}
                    className="h-6 w-6 text-[var(--waze-accent-text)]"
                  />
                  <div className="text-sm text-[var(--waze-text)]">
                    <p className="font-medium">
                      {formatWhen(segment.eta)} ·{" "}
                      {segment.distance_from_start_km} {m.planning.km}
                    </p>
                    <p className="text-[var(--waze-text-secondary)]">
                      {segment.summary_bg}
                      {segment.temperature_c != null
                        ? ` · ${Math.round(segment.temperature_c)}°C`
                        : ""}
                      {segment.wind_kmh != null
                        ? ` · ${Math.round(segment.wind_kmh)} km/h`
                        : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {plan.weather.attribution && (
          <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">
            {plan.weather.attribution}
          </p>
        )}
      </section>

      <RoadHazards plan={plan} />
      <AttentionSegments plan={plan} />

      <section aria-labelledby="plan-border">
        <h3
          id="plan-border"
          className="text-base font-semibold text-[var(--waze-text)]"
        >
          {m.sheet.border}
        </h3>
        <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
          {plan.border.note}
        </p>
        {chosen ? (
          <BorderWaitBlock chosen={chosen} />
        ) : (
          <p className="mt-2 text-sm text-[var(--waze-text)]">
            {m.sheet.borderDirect}
          </p>
        )}
        {serbiaHungaryChoices(
          plan.border.alternatives,
          chosen?.border_id ?? null
        ).map((border) => (
          <BorderWaitBlock key={border.border_id} chosen={border} />
        ))}
      </section>

      {plan.community.notes.length > 0 && (
        <section aria-labelledby="plan-community">
          <h3
            id="plan-community"
            className="text-base font-semibold text-[var(--waze-text)]"
          >
            {m.sheet.community}
            {plan.community.penalty_min > 0
              ? ` (+${plan.community.penalty_min} ${m.prefs.minutes})`
              : ""}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-[var(--waze-text-secondary)]">
            {plan.community.notes.map((note) => (
              <li key={note.id}>
                {note.title} · {note.age_label}
                {note.penalty_min > 0
                  ? ` · +${note.penalty_min} ${m.prefs.minutes}`
                  : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {((plan.fuel_averages ?? []).length > 0 ||
        plan.stops.some((stop) => stop.kinds.includes("fuel"))) && (
        <section aria-labelledby="plan-fuel-averages">
          <h3
            id="plan-fuel-averages"
            className="text-base font-semibold text-[var(--waze-text)]"
          >
            {m.sheet.fuelAverages}
          </h3>
          {(plan.fuel_averages ?? []).length === 0 ? (
            <p className="mt-2 text-sm text-[var(--waze-text-muted)]">
              {m.sheet.fuelAveragesEmpty}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--waze-border)] overflow-hidden rounded-xl bg-[var(--waze-surface-elevated)]">
              {(plan.fuel_averages ?? []).map((row) => (
                <li key={row.country_code} className="px-3 py-2">
                  <p className="text-sm text-[var(--waze-text)]">
                    {row.label_bg}
                  </p>
                  {row.price_eur_per_l != null && row.week_label_bg && (
                    <p className="text-[11px] text-[var(--waze-text-muted)]">
                      {m.sheet.fuelWeek} {row.week_label_bg} ·{" "}
                      {row.source_label_bg}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          <FuelPriceLegend />
        </section>
      )}

      <StopTimeline
        stops={plan.stops}
        included={included}
        onToggle={onToggleStop}
        focusedStopId={focusedStopId}
      />
      <PlanChecklist
        checklist={plan.checklist}
        warnings={plan.warnings}
        checks={checks}
        onToggle={onToggleCheck}
      />
      <button
        type="button"
        onClick={onCreate}
        className="plan-no-print waze-btn-primary w-full py-3.5 text-sm"
      >
        {m.sheet.createPlan}
      </button>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--waze-surface-elevated)] px-2 py-1.5">
      <dt className="text-[11px] text-[var(--waze-text-muted)]">{label}</dt>
      <dd className="font-semibold text-[var(--waze-text)]">{value}</dd>
    </div>
  );
}

function readChecks(key: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const checks: Record<string, boolean> = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (value === true) checks[id] = true;
    }
    return checks;
  } catch {
    return {};
  }
}
