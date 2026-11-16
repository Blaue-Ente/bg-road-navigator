"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import type { MessageCatalog } from "@/lib/i18n";
import { useState } from "react";
import { unitsFrom } from "@/lib/i18n/units";
import { formatClockDuration } from "@/lib/planner/itinerary";
import { replanTrip } from "@/lib/planner/replan-trip";
import {
  routeChoiceFromAlternative,
} from "@/lib/planner/route-options";
import type { RouteOptionSummary } from "@/lib/planner/types";
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
  onPick,
  m,
}: {
  option: RouteOptionSummary;
  pressed: boolean;
  disabled: boolean;
  onPick: () => void;
  m: MessageCatalog;
}) {
  const units = unitsFrom(m);
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onPick}
      className={`w-full rounded-2xl border p-3 text-left transition ${
        pressed
          ? "border-[var(--waze-accent)] bg-[var(--waze-accent-muted)]"
          : "border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] hover:border-[var(--waze-accent)]/40"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <p className="font-semibold text-[var(--waze-text)]">{option.label}</p>
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
          <dd className="font-medium text-[var(--waze-text)]">
            {option.wait_min} {m.routeChoice.waitSuffix}
          </dd>
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

export function RouteChoiceCards({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const options: RouteOptionsBlock | undefined = plan.route_options;
  const via = useRouteStore((s) => s.planningVia);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const setTripPlan = useRouteStore((s) => s.setTripPlan);
  const setActiveRouteStore = useRouteStore((s) => s.setActiveRoute);
  const setAlternativeRoutes = useRouteStore((s) => s.setAlternativeRoutes);
  const [busy, setBusy] = useState(false);

  if (!options) return null;

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

  const pick = async (target: RouteOptionSummary) => {
    if (busy || target.role === "primary") return;
    setBusy(true);
    try {
      const next = await replanTrip({
        plan,
        via,
        routeChoice: routeChoiceFromAlternative(target),
      });
      if (!next) return;
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
    } finally {
      setBusy(false);
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
        <RouteChoiceCard
          option={options.primary}
          pressed
          disabled={busy}
          onPick={() => {}}
          m={m}
        />
        {options.alternative ? (
          <RouteChoiceCard
            option={options.alternative}
            pressed={false}
            disabled={busy}
            onPick={() => void pick(options.alternative!)}
            m={m}
          />
        ) : null}
      </div>
      {busy ? (
        <p className="text-sm text-[var(--waze-text-secondary)]" aria-live="polite">
          {m.planning.calculatingStatus}
        </p>
      ) : null}
      {unavailableCopy ? (
        <p className="text-sm text-[var(--waze-text-secondary)]">{unavailableCopy}</p>
      ) : null}
    </section>
  );
}