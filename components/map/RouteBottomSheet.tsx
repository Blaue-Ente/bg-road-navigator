"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import Link from "next/link";
import { useState } from "react";
import { BedDouble, ChevronUp, CloudSun, Fuel, Landmark } from "lucide-react";
import type { Route } from "@/types/route.types";
import { formatTemplate } from "@/lib/i18n/format-template";
import { unitsFrom } from "@/lib/i18n/units";
import { formatClockDuration } from "@/lib/planner/itinerary";
import { isRoadRoute } from "@/lib/utils/route-builder";
import { useRouteStore } from "@/lib/stores/route.store";

interface RouteBottomSheetProps {
  route: Route;
  className?: string;
}

export function RouteBottomSheet({ route, className = "" }: RouteBottomSheetProps) {
  const m = useMessages();
  const units = unitsFrom(m);
  const [expanded, setExpanded] = useState(false);
  const clearRoute = useRouteStore((s) => s.clearRoute);
  const tripPlan = useRouteStore((s) => s.tripPlan);
  const setPlanDetailOpen = useRouteStore((s) => s.setPlanDetailOpen);

  const durationLabel = formatClockDuration(route.duration_min, units);
  const hours = Math.floor(route.duration_min / 60);
  const mins = route.duration_min % 60;
  const badgePrimary = hours > 0 ? hours : mins;
  const badgeUnit = hours > 0 ? m.map.msg4e4e5817ea : m.prefs.minutes;

  return (
    <div
      data-overlay-slot="bottom-sheet"
      className={`pointer-events-none w-full max-w-[min(22rem,calc(100vw-1.5rem))] md:max-w-[21rem] ${className}`.trim()}
    >
      <div className="pointer-events-auto overflow-hidden rounded-2xl waze-panel transition-all">
        <div className="flex w-full items-start gap-3 px-4 py-3">
          <div
            className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--waze-accent-muted)]"
            aria-hidden
          >
            <span className="text-lg font-bold leading-none text-[var(--waze-accent-text)]">
              {badgePrimary}
            </span>
            <span className="text-xs font-medium text-[var(--waze-accent-text)]">
              {badgeUnit}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full text-left"
              aria-expanded={expanded}
            >
              <p className="truncate text-base font-semibold text-[var(--waze-text)]">
                {route.destination.label}
              </p>
              <p className="mt-0.5 text-sm leading-snug text-[var(--waze-text-secondary)]">
                {durationLabel} · {route.distance_km} {m.units.km}
                {isRoadRoute(route.routing_source) && (
                  <span className="ml-1 text-[var(--waze-accent-text)]">
                    {m.map.msg0287d9cf5d}
                  </span>
                )}
              </p>
            </button>
            {tripPlan && !expanded && (
              <button
                type="button"
                data-tap="home-show-plan"
                onClick={() => setPlanDetailOpen(true)}
                className="waze-btn-primary mt-2 inline-flex min-h-11 w-full max-w-full items-center justify-center px-3 py-2 text-xs font-semibold sm:text-sm"
              >
                {m.sheet.showPlan}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--waze-text-muted)]"
            aria-expanded={expanded}
            aria-label={m.sheet.showPlan}
          >
            <ChevronUp
              className={`h-5 w-5 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        </div>

        {expanded && (
          <div className="border-t border-[var(--waze-border)] px-4 pb-4 pt-3">
            <p className="mb-1 text-xs text-[var(--waze-text-muted)]">{m.nav.route}</p>
            <p className="text-sm text-[var(--waze-text)]">
              {route.origin.label} → {route.destination.label}
            </p>
            {route.waypoints.length > 0 && (
              <p className="mt-1 text-xs text-[var(--waze-text-secondary)]">
                {formatTemplate(m.map.viaStops, {
                  stops: route.waypoints.map((w) => w.label).join(" → "),
                })}
              </p>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2">
              <Link
                href="/fuel"
                data-tap="stop-quick-fuel"
                className="inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] px-2 py-2 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent-text)]"
              >
                <Fuel className="h-5 w-5" strokeWidth={2} aria-hidden />{m.kinds.fuel}</Link>
              <Link
                href="/weather"
                className="flex flex-col items-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] py-2.5 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent-text)]"
              >
                <CloudSun className="h-5 w-5" strokeWidth={2} aria-hidden />{m.nav.weather}</Link>
              <Link
                href="/borders"
                className="flex flex-col items-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] py-2.5 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent-text)]"
              >
                <Landmark className="h-5 w-5" strokeWidth={2} aria-hidden />{m.nav.borders}</Link>
              <Link
                href="/hotels"
                data-tap="stop-quick-rest"
                className="inline-flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] px-2 py-2 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent-text)]"
              >
                <BedDouble className="h-5 w-5" strokeWidth={2} aria-hidden />{m.kinds.rest}</Link>
            </div>

            <div className="mt-3 flex gap-2">
              {tripPlan && (
                <button
                  type="button"
                  onClick={() => setPlanDetailOpen(true)}
                  className="waze-btn-secondary flex-1 py-2.5 text-sm"
                >
                  {m.planning.seePlan}
                </button>
              )}
              <Link
                href="/route"
                className="waze-btn-primary flex-1 py-2.5 text-center text-sm"
              >{m.home.change}</Link>
              <button
                onClick={clearRoute}
                className="waze-btn-secondary flex-1 py-2.5 text-sm text-[var(--waze-danger)]"
              >{m.routePage.msg72cdd825c4}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
