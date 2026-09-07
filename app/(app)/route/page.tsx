"use client";

import { useState } from "react";
import Link from "next/link";
import { getCityById } from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { useRouteStore } from "@/lib/stores/route.store";
import {
  estimateRestStops,
  formatDuration,
  isLongHaul,
} from "@/lib/utils/route-planner";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { LocationSearchInput } from "@/components/route/LocationSearchInput";
import { SaveRouteButton } from "@/components/route/SaveRouteButton";
import { MapsHandoffButtons } from "@/components/route/MapsHandoffButtons";
import { TripPlanCard } from "@/components/trips/TripPlanCard";
import { ManeuverList } from "@/components/route/ManeuverList";
import { FuelEstimateCard } from "@/components/route/FuelEstimateCard";
import { FxRatesCard } from "@/components/route/FxRatesCard";
import { WinterRulesList } from "@/components/route/WinterRulesList";
import type { Route, RouteAlternative, RoutePoint } from "@/types/route.types";

async function fetchRoute(params: {
  corridorId?: string;
  points?: RoutePoint[];
}): Promise<Route | null> {
  const response = await fetch("/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      corridor_id: params.corridorId,
      points: params.points,
    }),
  });

  if (!response.ok) return null;
  return response.json();
}

function toRoutePoint(cityId: string): RoutePoint | null {
  const city = getCityById(cityId);
  if (!city) return null;

  return {
    id: city.id,
    label: city.label,
    subtitle: city.country,
    coords: city.coords,
    source: "curated",
    countryCode: city.countryCode,
  };
}

export default function RoutePage() {
  const { activeRoute, setActiveRoute, setAlternativeRoutes, clearRoute } =
    useRouteStore();
  const [origin, setOrigin] = useState<RoutePoint | null>(() =>
    activeRoute
      ? { ...activeRoute.origin, source: "user" }
      : toRoutePoint("london")
  );
  const [destination, setDestination] = useState<RoutePoint | null>(() =>
    activeRoute
      ? { ...activeRoute.destination, source: "user" }
      : toRoutePoint("sofia")
  );
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [routeBorders, setRouteBorders] = useState<string[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);

  const promoteAlternative = (alt: RouteAlternative) => {
    if (!activeRoute) return;
    const previousMain: RouteAlternative = {
      id: `prev-${activeRoute.id}`,
      distance_km: activeRoute.distance_km,
      duration_min: activeRoute.duration_min,
      geometry: activeRoute.geometry,
      weight: 0,
    };
    const remaining = [
      previousMain,
      ...activeRoute.alternatives.filter((a) => a.id !== alt.id),
    ];
    const next: Route = {
      ...activeRoute,
      id: `${alt.id}-active`,
      distance_km: alt.distance_km,
      duration_min: alt.duration_min,
      geometry: alt.geometry,
      maneuvers: alt.maneuvers ?? [],
      alternatives: remaining,
    };
    setActiveRoute(next);
    setAlternativeRoutes(
      remaining.map((a) => ({
        ...activeRoute,
        id: a.id,
        distance_km: a.distance_km,
        duration_min: a.duration_min,
        geometry: a.geometry,
        alternatives: [],
      }))
    );
  };

  const handleCorridorSelect = (corridorId: string) => {
    const corridor = TRAVEL_CORRIDORS.find((c) => c.id === corridorId);
    if (!corridor) return;

    setSelectedCorridor(corridorId);
    const first = toRoutePoint(corridor.cityIds[0]!);
    const last = toRoutePoint(corridor.cityIds[corridor.cityIds.length - 1]!);
    if (first) setOrigin(first);
    if (last) setDestination(last);
    setRouteBorders(corridor.borderIds);
  };

  const runCalculation = async (corridorId?: string | null) => {
    setCalculating(true);
    setRouteError(null);

    if (!corridorId && (!origin || !destination)) {
      setCalculating(false);
      setRouteError("Изберете начална и крайна точка от резултатите.");
      return;
    }

    if (!corridorId && origin?.id === destination?.id) {
      setCalculating(false);
      setRouteError("Началната и крайната точка трябва да са различни.");
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
      points: corridorId ? undefined : [origin!, destination!],
    });

    if (!route) {
      setRouteError("Неуспешно изчисление. Опитайте отново.");
      setCalculating(false);
      return;
    }

    if (corridor) setRouteBorders(corridor.borderIds);
    setActiveRoute(route);
    setAlternativeRoutes(
      (route.alternatives ?? []).map((alt) => ({
        ...route,
        id: alt.id,
        distance_km: alt.distance_km,
        duration_min: alt.duration_min,
        geometry: alt.geometry,
        alternatives: [],
      }))
    );
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
          subtitle="Въведете град, адрес, хотел или друга точка в Европа"
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
          <LocationSearchInput
            key={origin?.id ?? "origin-empty"}
            id="origin"
            label="Откъде"
            value={origin}
            placeholder="Град, адрес или обект — напр. Мюнхен"
            onSelect={(place) => {
              setOrigin(place);
              setSelectedCorridor(null);
            }}
          />

          <LocationSearchInput
            key={destination?.id ?? "destination-empty"}
            id="destination"
            label="Накъде"
            value={destination}
            placeholder="Къде пътувате — напр. София"
            onSelect={(place) => {
              setDestination(place);
              setSelectedCorridor(null);
            }}
          />

          <p className="text-xs leading-relaxed text-[var(--waze-text-muted)]">
            Изберете резултат от търсенето, за да използвате точни координати.
            Поддържат се адреси, градове, хотели и пътни обекти в Европа.
          </p>

          {routeError && <p className="text-sm text-red-400">{routeError}</p>}

          <button
            onClick={() => runCalculation(selectedCorridor)}
            disabled={
              calculating ||
              (!selectedCorridor &&
                (!origin || !destination || origin.id === destination.id))
            }
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
                  През: {activeRoute.waypoints.map((w) => w.label).join(" → ")}
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
                  {activeRoute.routing_source === "osrm"
                    ? "по пътищата"
                    : "приблизителна оценка"}
                </span>
                {longHaul && (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-200">
                    {restStops + 1} почивки препоръчани
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <MapsHandoffButtons route={activeRoute} />
                <SaveRouteButton route={activeRoute} />
                <Link href="/" className="waze-btn-secondary px-4 py-2 text-sm">
                  Картата
                </Link>
                <Link
                  href={`/borders?route=1${routeBorders.length ? `&border_ids=${routeBorders.join(",")}` : ""}`}
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >
                  Граници ({routeBorders.length || "всички"})
                </Link>
                <Link
                  href="/weather"
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >
                  Прогноза
                </Link>
                <Link
                  href="/fuel?route=1"
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >
                  Гориво по маршрута
                </Link>
                <Link
                  href="/vignettes"
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >
                  Винетки
                </Link>
                <Link
                  href={
                    selectedCorridor
                      ? `/hotels?corridor=${selectedCorridor}`
                      : "/hotels"
                  }
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

            {activeRoute.alternatives.length > 0 && (
              <WazeCard>
                <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
                  Алтернативни маршрути ({activeRoute.alternatives.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeRoute.alternatives.map((alt, index) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => promoteAlternative(alt)}
                      className="waze-chip"
                    >
                      Вариант {index + 1}: {alt.distance_km} км ·{" "}
                      {formatDuration(alt.duration_min)}
                    </button>
                  ))}
                </div>
              </WazeCard>
            )}

            <TripPlanCard route={activeRoute} />

            <FuelEstimateCard distanceKm={activeRoute.distance_km} />

            <WazeCard>
              <ManeuverList maneuvers={activeRoute.maneuvers ?? []} />
            </WazeCard>

            <WazeCard>
              <FxRatesCard />
            </WazeCard>

            <WazeCard>
              <WinterRulesList />
            </WazeCard>

            <WazeCard>
              <h3 className="text-sm font-semibold text-[var(--waze-text)]">
                Винетки по пътя
              </h3>
              <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
                Преди тръгване проверете официалните портали за електронни
                винетки в държавите по маршрута.
              </p>
              <Link
                href="/vignettes"
                className="mt-3 inline-flex text-sm font-medium text-[var(--waze-accent)] hover:underline"
              >
                Отвори пълния списък
              </Link>
            </WazeCard>

            {routeBorders.length > 0 && (
              <WazeCard>
                <h3 className="mb-1 text-sm font-semibold text-[var(--waze-text)]">
                  Граници по маршрута ({routeBorders.length})
                </h3>
                <p className="text-xs text-[var(--waze-text-muted)]">
                  Проверете опашките и алтернативните пролази преди тръгване —
                  особено при пътувания над 24 часа.
                </p>
              </WazeCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
