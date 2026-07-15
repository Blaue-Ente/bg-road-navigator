"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EUROPEAN_CITIES,
  REGION_LABELS,
  type EuropeanRegion,
} from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { useRouteStore } from "@/lib/stores/route.store";
import {
  estimateRestStops,
  formatDuration,
  isLongHaul,
} from "@/lib/utils/route-planner";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import type { Route } from "@/types/route.types";

const REGIONS = Object.keys(REGION_LABELS) as EuropeanRegion[];

async function fetchRoute(params: {
  corridorId?: string;
  originId?: string;
  destinationId?: string;
}): Promise<Route | null> {
  const response = await fetch("/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      corridor_id: params.corridorId,
      origin_id: params.originId,
      destination_id: params.destinationId,
    }),
  });

  if (!response.ok) return null;
  return response.json();
}

export default function RoutePage() {
  const { activeRoute, setActiveRoute, clearRoute } = useRouteStore();
  const [originLabel, setOriginLabel] = useState(
    activeRoute?.origin.label ?? "Лондон"
  );
  const [destLabel, setDestLabel] = useState(
    activeRoute?.destination.label ?? "София"
  );
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [routeBorders, setRouteBorders] = useState<string[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);

  const handleCorridorSelect = (corridorId: string) => {
    const corridor = TRAVEL_CORRIDORS.find((c) => c.id === corridorId);
    if (!corridor) return;

    setSelectedCorridor(corridorId);
    const first = EUROPEAN_CITIES.find((c) => c.id === corridor.cityIds[0]);
    const last = EUROPEAN_CITIES.find(
      (c) => c.id === corridor.cityIds[corridor.cityIds.length - 1]
    );
    if (first) setOriginLabel(first.label);
    if (last) setDestLabel(last.label);
    setRouteBorders(corridor.borderIds);
  };

  const runCalculation = async (corridorId?: string | null) => {
    setCalculating(true);
    setRouteError(null);

    const origin = EUROPEAN_CITIES.find((c) => c.label === originLabel);
    const dest = EUROPEAN_CITIES.find((c) => c.label === destLabel);

    if (!corridorId && (!origin || !dest)) {
      setCalculating(false);
      setRouteError("Изберете валидни градове.");
      return;
    }

    if (!corridorId && origin?.id === dest?.id) {
      setCalculating(false);
      return;
    }

    const corridor = corridorId
      ? TRAVEL_CORRIDORS.find((c) => c.id === corridorId)
      : null;

    if (corridor) {
      setSelectedCorridor(corridorId!);
      setRouteBorders(corridor.borderIds);
    } else {
      setSelectedCorridor(null);
      setRouteBorders([]);
    }

    const route = await fetchRoute({
      corridorId: corridorId ?? undefined,
      originId: origin?.id,
      destinationId: dest?.id,
    });

    if (!route) {
      setRouteError("Неуспешно изчисление. Опитайте отново.");
      setCalculating(false);
      return;
    }

    if (corridor) setRouteBorders(corridor.borderIds);
    setActiveRoute(route);
    setCalculating(false);
  };

  const longHaul = activeRoute ? isLongHaul(activeRoute.duration_min) : false;
  const restStops = activeRoute
    ? estimateRestStops(activeRoute.duration_min)
    : 0;

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Планиране на маршрут"
          subtitle="Реални пътни разстояния (OSRM) · Европа, включително 30+ часа"
        />

        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--waze-text-muted)]">
            Коридори ({TRAVEL_CORRIDORS.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_CORRIDORS.map((corridor) => (
              <button
                key={corridor.id}
                onClick={() => handleCorridorSelect(corridor.id)}
                className={`waze-chip ${
                  selectedCorridor === corridor.id ? "waze-chip-active" : ""
                }`}
              >
                {corridor.label} · ~{corridor.estimatedHours}ч
              </button>
            ))}
          </div>
        </section>

        <WazeCard className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--waze-text-secondary)]">
              Откъде
            </label>
            <select
              value={originLabel}
              onChange={(e) => {
                setOriginLabel(e.target.value);
                setSelectedCorridor(null);
              }}
              className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none focus:border-[var(--waze-accent)]"
            >
              {REGIONS.map((region) => (
                <optgroup key={region} label={REGION_LABELS[region]}>
                  {EUROPEAN_CITIES.filter((c) => c.region === region).map(
                    (city) => (
                      <option key={city.id} value={city.label}>
                        {city.label}, {city.country}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--waze-text-secondary)]">
              Накъде
            </label>
            <select
              value={destLabel}
              onChange={(e) => {
                setDestLabel(e.target.value);
                setSelectedCorridor(null);
              }}
              className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none focus:border-[var(--waze-accent)]"
            >
              {REGIONS.map((region) => (
                <optgroup key={region} label={REGION_LABELS[region]}>
                  {EUROPEAN_CITIES.filter((c) => c.region === region).map(
                    (city) => (
                      <option key={city.id} value={city.label}>
                        {city.label}, {city.country}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          {routeError && (
            <p className="text-sm text-red-400">{routeError}</p>
          )}

          <button
            onClick={() => runCalculation(selectedCorridor)}
            disabled={calculating || (!selectedCorridor && originLabel === destLabel)}
            className="waze-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
          >
            {calculating ? "Изчисляване по пътища..." : "Изчисли маршрут"}
          </button>
        </WazeCard>

        {activeRoute && (
          <div className="mt-6 space-y-4">
            <WazeCard className="border-[var(--waze-accent)]/20 bg-[var(--waze-accent-muted)]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--waze-accent)]">
                Активен маршрут
              </h2>
              <p className="text-lg font-semibold text-[var(--waze-text)]">
                {activeRoute.origin.label} → {activeRoute.destination.label}
              </p>
              {activeRoute.waypoints.length > 0 && (
                <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
                  През:{" "}
                  {activeRoute.waypoints.map((w) => w.label).join(" → ")}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-[var(--waze-text-secondary)]">
                <span className="rounded-full bg-[var(--waze-surface-elevated)] px-3 py-1">
                  {activeRoute.distance_km} км
                </span>
                <span className="rounded-full bg-[var(--waze-surface-elevated)] px-3 py-1">
                  {formatDuration(activeRoute.duration_min)}
                </span>
                <span className="rounded-full bg-[var(--waze-surface-elevated)] px-3 py-1 text-xs">
                  {activeRoute.routing_source === "osrm" ? "OSRM" : "≈ оценка"}
                </span>
                {longHaul && (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-200">
                    {restStops + 1} почивки препоръчани
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/" className="waze-btn-primary px-4 py-2 text-sm">
                  Картата
                </Link>
                <Link
                  href={`/borders?route=1${routeBorders.length ? `&border_ids=${routeBorders.join(",")}` : ""}`}
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >
                  Граници ({routeBorders.length || "всички"})
                </Link>
                <Link href="/weather" className="waze-btn-secondary px-4 py-2 text-sm">
                  Прогноза
                </Link>
                <Link href="/fuel" className="waze-btn-secondary px-4 py-2 text-sm">
                  Гориво
                </Link>
                <Link
                  href={selectedCorridor ? `/hotels?corridor=${selectedCorridor}` : "/hotels"}
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >
                  Почивки
                </Link>
                {longHaul && (
                  <Link
                    href="/tips"
                    className="waze-btn-secondary border-amber-500/30 px-4 py-2 text-sm text-amber-200"
                  >
                    Съвети
                  </Link>
                )}
                <button
                  onClick={clearRoute}
                  className="waze-btn-secondary px-4 py-2 text-sm text-red-400"
                >
                  Изчисти
                </button>
              </div>
            </WazeCard>

            {routeBorders.length > 0 && (
              <WazeCard>
                <h3 className="mb-1 text-sm font-semibold text-[var(--waze-text)]">
                  Граници по маршрута ({routeBorders.length})
                </h3>
                <p className="text-xs text-[var(--waze-text-muted)]">
                  Проверете опашките преди тръгване — особено при пътувания над
                  24 часа.
                </p>
              </WazeCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
