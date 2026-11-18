"use client";

import { MapPin } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { WeatherGlyphIcon } from "@/components/weather/WeatherGlyph";
import { BorderWaitBlock } from "@/components/plan/BorderWaitBlock";
import { serbiaHungaryChoices } from "@/lib/planner/border-wait-view";
import { FuelPriceLegend } from "@/components/plan/FuelPriceLegend";
import { PlanChecklist } from "@/components/plan/PlanChecklist";
import { PlanItineraryView } from "@/components/plan/PlanItineraryView";
import { RouteChoiceCards } from "@/components/plan/RouteChoiceCards";
import { formatWhen, StopTimeline } from "@/components/plan/StopTimeline";
import { CostsSection } from "@/components/plan/CostsSection";
import { TripGuide } from "@/components/plan/TripGuide";
import { checklistPlanKey } from "@/lib/pdf/plan-pdf";
import { useUserStore } from "@/lib/stores/user.store";
import { useDialogFocus } from "@/components/plan/useDialogFocus";
import { PlanRoadNotes } from "@/components/plan/PlanRoadNotes";
import { AiTripNote } from "@/components/plan/AiTripNote";
import { weatherSegmentsForDisplay } from "@/lib/planner/road-notes-view";
import { formatTemplate } from "@/lib/i18n/format-template";
import { showAllWeatherLabel } from "@/lib/i18n/show-all-labels";
import {
  currentLocationPreference,
  locationPreferenceServerSnapshot,
  locationPreferenceSnapshot,
  subscribeLocationPreference,
} from "@/lib/location/browser-pref";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { unitsFrom } from "@/lib/i18n/units";
import { useTripSessionStore } from "@/lib/stores/trip-session.store";
import { arrivalIncludesMessage } from "@/lib/planner/arrival-subline";
import {
  checklistStorageKey,
  defaultIncludedStops,
  formatClockDuration,
  whySummary,
} from "@/lib/planner/itinerary";
import { formatPlanInstant } from "@/lib/planner/plan-time";
import type { TripPlannerResult } from "@/lib/planner/types";
import { useRouteStore } from "@/lib/stores/route.store";
import { wmoToWeather } from "@/lib/utils/weather-codes";

export function PlanDetailSheet() {
  const m = useMessages();
  const locale = useLocale();
  const units = unitsFrom(m);
  const open = useRouteStore((state) => state.planDetailOpen);
  const plan = useRouteStore((state) => state.tripPlan);
  const via = useRouteStore((state) => state.planningVia);
  const focusedStopId = useRouteStore((state) => state.focusedStopId);
  const setOpen = useRouteStore((state) => state.setPlanDetailOpen);
  const [minimized, setMinimized] = useState(false);
  const [headerOpen, setHeaderOpen] = useState(false);
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
    queueMicrotask(() => {
      setView("detail");
      setSnapshot(null);
      setIncluded(defaultIncludedStops(current.stops));
      setChecks(readChecks(checklistStorageKey(current)));
      setMinimized(false);
    });
  }, [stamp]);

  useEffect(() => {
    if (focusedStopId) queueMicrotask(() => setMinimized(false));
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
    plan.route.arrive_at ??
      new Date(plan.depart_at).getTime() + plan.route.total_min * 60_000
  );
  const hasOvernightSleep = plan.stops.some(
    (stop) => stop.sleep_min != null && stop.sleep_min > 0
  );
  const arrivalSubline = arrivalIncludesMessage(plan, m.sheet, units);
  const summary = whySummary(plan.why_this_route);

  const toggleCheck = (id: string, checked: boolean) => {
    const next = { ...checks, [id]: checked };
    setChecks(next);
    try {
      localStorage.setItem(checklistStorageKey(plan), JSON.stringify(next));
    } catch {
      // Private mode can reject storage. The boxes still work for this visit.
    }
    // A checklist kept in the profile gets the tick too; a miss is not shown.
    const planKey = checklistPlanKey(plan);
    if (useUserStore.getState().session?.user) {
      void fetch("/api/checklists", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_key: planKey, checks: { [id]: checked } }),
      }).catch(() => undefined);
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div
        ref={dialogRef}
        id="plan-detail"
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
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
            {plan.route.distance_km} {m.planning.km} ·{" "}
            {formatClockDuration(plan.route.total_min, units)} ·{" "}
            {formatPlanInstant(
              arrival.toISOString(),
              locale,
              plan.route.destination.time_zone
            )}
          </p>
          {headerOpen ? (
            <>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Stat
                  label={m.sheet.distance}
                  value={`${plan.route.distance_km} ${m.planning.km}`}
                />
                <Stat
                  label={m.sheet.driving}
                  value={formatClockDuration(plan.route.duration_min, units)}
                />
                <Stat
                  label={m.sheet.total}
                  value={formatClockDuration(plan.route.total_min, units)}
                />
                <Stat
                  label={m.sheet.eta}
                  value={formatPlanInstant(
                    arrival.toISOString(),
                    locale,
                    plan.route.destination.time_zone
                  )}
                />
              </dl>
              {arrivalSubline ? (
                <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
                  {arrivalSubline}
                </p>
              ) : null}
              {hasOvernightSleep ? (
                <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
                  {m.sheet.includesOvernight}{" "}
                  {formatClockDuration(plan.route.duration_min, units)}.
                </p>
              ) : plan.preferences.overnight ? (
                <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
                  {m.sheet.fitsOneDay}
                </p>
              ) : null}
            </>
          ) : null}
          <div className="plan-no-print mt-2 flex flex-wrap items-center gap-2">
            <TripMode />
            <button
              type="button"
              onClick={() => setHeaderOpen((open) => !open)}
              aria-expanded={headerOpen}
              className="waze-btn-secondary px-3 py-1.5 text-xs"
            >
              {headerOpen ? m.sheet.headerLess : m.sheet.headerMore}
            </button>
          </div>
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
  const m = useMessages();
  const active = useTripSessionStore((state) => state.active);
  const start = useTripSessionStore((state) => state.start);
  const stop = useTripSessionStore((state) => state.stop);
  const setPlanDetailOpen = useRouteStore((state) => state.setPlanDetailOpen);
  const raw = useSyncExternalStore(
    subscribeLocationPreference,
    locationPreferenceSnapshot,
    locationPreferenceServerSnapshot
  );
  const locationOn = raw ? currentLocationPreference().location_opt_in : false;
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (active) {
            stop();
            return;
          }
          // The driving view takes over from the plan sheet.
          start();
          setPlanDetailOpen(false);
        }}
        className="plan-no-print rounded-full bg-[var(--waze-accent)] px-4 py-2 text-sm font-semibold text-white"
      >
        {active ? m.sheet.endTrip : m.sheet.onTrip}
      </button>
      {active && !locationOn && (
        <p className="basis-full text-xs text-[var(--waze-text-muted)]">
          {m.sheet.tripNeedsLocation}
        </p>
      )}
    </>
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
  const m = useMessages();
  const chosen = plan.border.chosen;
  return (
    <>
      <RouteChoiceCards plan={plan} />

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
        <AiTripNote plan={plan} />
      </section>

      <StopTimeline
        stops={plan.stops}
        included={included}
        onToggle={onToggleStop}
        focusedStopId={focusedStopId}
      />

      {plan.costs ? <CostsSection costs={plan.costs} /> : null}

      <TripGuide plan={plan} checks={checks} />

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

      <PlanChecklist
        checklist={plan.checklist}
        warnings={plan.warnings}
        checks={checks}
        onToggle={onToggleCheck}
      />

      <PlanWeatherSection plan={plan} />

      <PlanRoadNotes plan={plan} />

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
        <PlanFuelAveragesSection plan={plan} />
      )}
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

function WeatherSegmentRow({
  segment,
}: {
  segment: TripPlannerResult["weather"]["segments"][number];
}) {
  const m = useMessages();
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
          {formatWhen(segment.eta)} · {segment.distance_from_start_km}{" "}
          {m.planning.km}
        </p>
        {segment.place ? (
          <p className="inline-flex items-center gap-1 text-[var(--waze-text-secondary)]">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {segment.place}
          </p>
        ) : null}
        {segment.summary_bg ? (
          <p className="text-[var(--waze-text-secondary)]">
            {segment.summary_bg}
            {segment.temperature_c != null
              ? ` · ${Math.round(segment.temperature_c)}°C`
              : ""}
            {segment.wind_kmh != null
              ? ` · ${Math.round(segment.wind_kmh)} km/h`
              : ""}
          </p>
        ) : segment.temperature_c != null || segment.wind_kmh != null ? (
          <p className="text-[var(--waze-text-secondary)]">
            {segment.temperature_c != null
              ? `${Math.round(segment.temperature_c)}°C`
              : ""}
            {segment.wind_kmh != null
              ? `${segment.temperature_c != null ? " · " : ""}${Math.round(segment.wind_kmh)} km/h`
              : ""}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function PlanWeatherSection({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const { featured, rest } = weatherSegmentsForDisplay(plan.weather.segments);
  return (
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
        <>
          {plan.weather.segments.every(
            (segment) => !segment.summary_bg?.trim()
          ) ? (
            <p className="mt-2 text-sm text-[var(--waze-text-muted)]">
              {m.sheet.weatherEmpty}
            </p>
          ) : null}
          <ul className="mt-2 space-y-2">
            {featured.map((segment) => (
              <WeatherSegmentRow
                key={`w-${segment.eta}-${segment.distance_from_start_km}`}
                segment={segment}
              />
            ))}
            {rest.length === 1 ? (
              <WeatherSegmentRow segment={rest[0]!} />
            ) : null}
          </ul>
          {rest.length > 1 ? (
            <details className="mt-2">
              <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-[var(--waze-accent-text)]">
                {showAllWeatherLabel(rest.length, locale)}
              </summary>
              <ul className="mt-2 space-y-2">
                {rest.map((segment) => (
                  <WeatherSegmentRow
                    key={`wr-${segment.eta}-${segment.distance_from_start_km}`}
                    segment={segment}
                  />
                ))}
              </ul>
            </details>
          ) : null}
        </>
      )}
      {plan.weather.attribution ? (
        <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">
          {plan.weather.attribution}
        </p>
      ) : null}
    </section>
  );
}

function PlanFuelAveragesSection({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  return (
    <section aria-labelledby="plan-fuel-averages">
      <details className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center px-3 text-base font-semibold text-[var(--waze-text)] [&::-webkit-details-marker]:hidden">
          {m.sheet.fuelAverages}
        </summary>
        <div className="border-t border-[var(--waze-border)] px-3 py-3">
          {(plan.fuel_averages ?? []).length === 0 ? (
            <p className="text-sm text-[var(--waze-text-muted)]">
              {m.sheet.fuelAveragesEmpty}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--waze-border)] overflow-hidden rounded-xl bg-[var(--waze-surface)]">
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
          <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
            {m.sheet.fuelAveragesDisclaimer}
          </p>
          <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
            {m.sheet.fuelNoTripTotal}
          </p>
          <FuelPriceLegend />
        </div>
      </details>
    </section>
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
