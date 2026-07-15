"use client";

import Link from "next/link";
import { useState } from "react";
import type { Route } from "@/types/route.types";
import { formatDuration } from "@/lib/utils/route-planner";
import { useRouteStore } from "@/lib/stores/route.store";

interface RouteBottomSheetProps {
  route: Route;
}

export function RouteBottomSheet({ route }: RouteBottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const clearRoute = useRouteStore((s) => s.clearRoute);

  const hours = Math.floor(route.duration_min / 60);
  const mins = route.duration_min % 60;
  const etaDisplay =
    hours >= 24
      ? formatDuration(route.duration_min)
      : mins > 0
        ? `${hours}ч ${mins}м`
        : `${hours}ч`;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 px-3"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="pointer-events-auto mx-auto max-w-lg overflow-hidden rounded-2xl waze-panel shadow-2xl transition-all">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-4 px-4 py-3 text-left"
          aria-expanded={expanded}
        >
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--waze-accent-muted)]">
            <span className="text-lg font-bold leading-none text-[var(--waze-accent)]">
              {hours > 0 ? hours : mins}
            </span>
            <span className="text-[10px] font-medium text-[var(--waze-accent)]">
              {hours > 0 ? "часа" : "мин"}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-[var(--waze-text)]">
              {route.destination.label}
            </p>
            <p className="text-sm text-[var(--waze-text-secondary)]">
              {etaDisplay} · {route.distance_km} км
              {route.routing_source === "osrm" && (
                <span className="ml-1 text-[var(--waze-accent)]">· OSRM</span>
              )}
            </p>
          </div>

          <span
            className={`shrink-0 text-[var(--waze-text-muted)] transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▲
          </span>
        </button>

        {expanded && (
          <div className="border-t border-[var(--waze-border)] px-4 pb-4 pt-3">
            <p className="mb-1 text-xs text-[var(--waze-text-muted)]">Маршрут</p>
            <p className="text-sm text-[var(--waze-text)]">
              {route.origin.label} → {route.destination.label}
            </p>
            {route.waypoints.length > 0 && (
              <p className="mt-1 text-xs text-[var(--waze-text-secondary)]">
                През: {route.waypoints.map((w) => w.label).join(" → ")}
              </p>
            )}

            <div className="mt-4 grid grid-cols-4 gap-2">
              <Link
                href="/fuel"
                className="flex flex-col items-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] py-2.5 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent)]"
              >
                <span className="text-lg">⛽</span>
                Гориво
              </Link>
              <Link
                href="/weather"
                className="flex flex-col items-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] py-2.5 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent)]"
              >
                <span className="text-lg">🌤</span>
                Време
              </Link>
              <Link
                href="/borders"
                className="flex flex-col items-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] py-2.5 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent)]"
              >
                <span className="text-lg">🛃</span>
                Граници
              </Link>
              <Link
                href="/hotels"
                className="flex flex-col items-center gap-1 rounded-xl bg-[var(--waze-surface-elevated)] py-2.5 text-xs text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent)]"
              >
                <span className="text-lg">🏨</span>
                Почивка
              </Link>
            </div>

            <div className="mt-3 flex gap-2">
              <Link href="/route" className="waze-btn-primary flex-1 py-2.5 text-center text-sm">
                Промени
              </Link>
              <button
                onClick={clearRoute}
                className="waze-btn-secondary flex-1 py-2.5 text-sm text-red-400"
              >
                Изчисти
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
