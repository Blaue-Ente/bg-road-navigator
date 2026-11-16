"use client";

import { useEffect, useReducer } from "react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { MessageCatalog } from "@/lib/i18n";
import { unitsFrom } from "@/lib/i18n/units";
import { routeChoiceWaitLine } from "@/lib/planner/border-wait-view";
import {
  choiceCardOrderKeysFromOptions,
  choicePickReducer,
  optionChoiceKey,
  orderChoiceCards,
} from "@/lib/planner/choice-cards";
import { formatClockDuration } from "@/lib/planner/itinerary";
import { replanTrip } from "@/lib/planner/replan-trip";
import { routeChoiceFromAlternative } from "@/lib/planner/route-options";
import type { RouteOptionSummary, WaitEstimate } from "@/lib/planner/types";
import type { RouteOptionsBlock, TripPlannerResult } from "@/lib/planner/types";
import { getVignetteByCountryCode } from "@/lib/constants/vignettes";
import { useRouteStore } from "@/lib/stores/route.store";
import type { Route } from "@/types/route.types";

function chargeChips(
  codes: string[],
  kind: "vignette" | "toll",
  m: MessageCatalog
) {
  return codes.map((code) => {
    const link = getVignetteByCountryCode(code);
    const isVignette = link?.kind === "vignette";
    if (kind === "vignette" && !isVignette) return null;
    if (kind === "toll" && isVignette) return null;
    const role = link?.link_role === "info" ? m.checklist.officialInfo : m.checklist.officialShop;
    return (
      <span
        key={`${kind}-${code}`}
        className="inline-flex items-center rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] px-2 py-0.5 text-xs text-[var(--waze-text)]"
        title={role}
      >
        {code}
        {kind === "toll" ? m.routeChoice.tollMark : ""}
      </span>
    );
  });
}

function RouteChoiceCard({
  option,
  pressed,
  disabled,
  busy,
  onPick,
  wait,
  m,
  locale,
}: {
  option: RouteOptionSummary;
  pressed: boolean;
  disabled: boolean;
  busy: boolean;
  onPick: () => void;
  wait: WaitEstimate | null;
  m: MessageCatalog;
  locale: ReturnType<typeof useLocale>;
}) {
  const units = unitsFrom(m);
  const waitLabel = wait
    ? routeChoiceWaitLine(wait, locale)
    : option.wait_min > 0
      ? `${option.wait_min} ${m.routeChoice.waitSuffix}`
      : m.prefs.borderNoWaitData;
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-busy={busy || undefined}
      disabled={disabled}
      onClick={onPick}
      className={`w-full rounded-2xl border p-3 text-left transition ${
        pressed
          ? "border-[var(--waze-accent)] bg-[var(--waze-accent-muted)]"
          : "border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] hover:border-[var(--waze-accent)]/40"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <p className="font-semibold text-[var(--waze-text)]">{option.label}</p>
      {busy ? (
        <p className="mt-1 text-sm text-[var(--waze-accent-text)]" aria-live="polite">
          {m.routeChoice.switching}
        </p>
      ) : null}
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-[var(--waze-text-secondary)]">
        <div>
          <dt className="text-xs uppercase tracking-wide">{m.sheet.distance}</dt>
          <dd className="font-medium text-[var(--waze-text)]">
            {option.distance_km} {m.planning.km}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">{m.sheet.driving}</dt>
          <dd className="font-medium text-[var(--waze-text)]">
            {formatClockDuration(option.drive_min, units)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">{m.sheet.borderWait}</dt>
          <dd className="font-medium text-[var(--waze-text)]">{waitLabel}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide">{m.sheet.total}</dt>
          <dd className="font-medium text-[var(--waze-text)]">
            {formatClockDuration(option.total_min, units)}
          </dd>
        </div>
      </dl>
      {(option.vignette_codes.length > 0 || option.toll_codes.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {chargeChips(option.vignette_codes, "vignette", m)}
          {chargeChips(option.toll_codes, "toll", m)}
        </div>
      )}
    </button>
  );
}

function routeFromPlanOption(
  base: Route | null,
  plan: TripPlannerResult,
  option: RouteOptionSummary,
  altIndex: number
): Route {
  const shell: Route =
    base ??
    ({
      id: `plan-${plan.route.origin.lng}`,
      origin: {
        id: "origin",
        label: plan.route.origin.label,
        coords: {
          lng: plan.route.origin.lng,
          lat: plan.route.origin.lat,
        },
      },
      destination: {
        id: "destination",
        label: plan.route.destination.label,
        coords: {
          lng: plan.route.destination.lng,
          lat: plan.route.destination.lat,
        },
      },
      waypoints: [],
      distance_km: option.distance_km,
      duration_min: option.drive_min,
      geometry: option.geometry,
      alternatives: [],
    } satisfies Route);

  return {
    ...shell,
    id: altIndex === 0 ? shell.id : `route-alt-${altIndex}`,
    distance_km: option.distance_km,
    duration_min: option.drive_min,
    geometry: option.geometry,
    alternatives: [],
  };
}

export function applyPlanRouteOptions(
  plan: TripPlannerResult,
  activeRoute: Route | null,
  setAlternativeRoutes: (routes: Route[]) => void
) {
  const alt = plan.route_options?.alternative;
  if (!alt) {
    setAlternativeRoutes([]);
    return;
  }
  setAlternativeRoutes([routeFromPlanOption(activeRoute, plan, alt, 0)]);
}

function waitForOption(
  plan: TripPlannerResult,
  option: RouteOptionSummary
): WaitEstimate | null {
  if (!option.border_id) return null;
  if (plan.border.chosen?.border_id === option.border_id) {
    return plan.border.chosen.wait;
  }
  return (
    plan.border.alternatives.find(
      (row) => row.border_id === option.border_id
    )?.wait ?? null
  );
}

export function RouteChoiceCards({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  const options: RouteOptionsBlock | undefined = plan.route_options;
  const via = useRouteStore((s) => s.planningVia);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const orderKeys = useRouteStore((s) => s.choiceCardOrderKeys);
  const setChoiceCardOrderKeys = useRouteStore((s) => s.setChoiceCardOrderKeys);
  const setTripPlan = useRouteStore((s) => s.setTripPlan);
  const setActiveRouteStore = useRouteStore((s) => s.setActiveRoute);
  const setAlternativeRoutes = useRouteStore((s) => s.setAlternativeRoutes);
  const [pickState, dispatchPick] = useReducer(choicePickReducer, {
    pendingId: null,
    switchFailed: false,
  });

  useEffect(() => {
    if (!options || orderKeys) return;
    setChoiceCardOrderKeys(choiceCardOrderKeysFromOptions(options, null));
  }, [options, orderKeys, setChoiceCardOrderKeys]);

  if (!options) return null;

  const orderedCards = orderChoiceCards(options, orderKeys);
  const activeKey = optionChoiceKey(options.primary);

  const unavailableCopy = (() => {
    if (!options.alternative) {
      if (options.unavailable_reason === "constraints") {
        return m.sheet.oneRouteConstraints;
      }
      if (
        options.unavailable_reason === "same_country" ||
        options.unavailable_reason === "too_short" ||
        options.unavailable_reason === "no_divergent_path"
      ) {
        return m.sheet.oneRoute;
      }
    }
    return null;
  })();

  const pending = pickState.pendingId != null;

  const pick = async (target: RouteOptionSummary) => {
    const targetKey = optionChoiceKey(target);
    if (pending || targetKey === activeKey) return;
    dispatchPick({ type: "pick", id: targetKey });
    try {
      const next = await replanTrip({
        plan,
        via,
        routeChoice: routeChoiceFromAlternative(target),
      });
      if (!next) {
        dispatchPick({ type: "failure" });
        return;
      }
      setChoiceCardOrderKeys(
        choiceCardOrderKeysFromOptions(
          next.route_options!,
          choiceCardOrderKeysFromOptions(options, orderKeys)
        )
      );
      dispatchPick({ type: "success" });
      setTripPlan(next);
      if (activeRoute) {
        const mapped: Route = {
          ...activeRoute,
          distance_km: next.route.distance_km,
          duration_min: next.route.duration_min,
          geometry: next.route.geometry,
          routing_source: next.route.routing_source,
        };
        setActiveRouteStore(mapped);
      }
      applyPlanRouteOptions(next, activeRoute, setAlternativeRoutes);
    } catch {
      dispatchPick({ type: "failure" });
    }
  };

  return (
    <section className="space-y-3" aria-labelledby="route-choice-heading">
      <h3
        id="route-choice-heading"
        className="text-base font-semibold text-[var(--waze-text)]"
      >
        {m.sheet.routeChoice}
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {orderedCards.map((option) => {
          const key = optionChoiceKey(option);
          const isPending = pickState.pendingId === key;
          const pressed = isPending || (!pending && key === activeKey);
          const disabled = pending;
          const isPrimarySlot = key === activeKey;
          return (
            <RouteChoiceCard
              key={key}
              option={option}
              pressed={pressed}
              disabled={disabled}
              busy={isPending}
              onPick={() => {
                if (isPrimarySlot || pending) return;
                void pick(option);
              }}
              wait={waitForOption(plan, option)}
              m={m}
              locale={locale}
            />
          );
        })}
      </div>
      {options.alternative ? (
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {m.routeChoice.onlyTwo}
        </p>
      ) : null}
      {pickState.switchFailed ? (
        <p className="text-sm text-[var(--waze-danger)]" role="alert">
          {m.routeChoice.switchFailed}
        </p>
      ) : null}
      {unavailableCopy ? (
        <p className="text-sm text-[var(--waze-text-secondary)]">{unavailableCopy}</p>
      ) : null}
    </section>
  );
}