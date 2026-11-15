"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCityById } from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { useRouteStore } from "@/lib/stores/route.store";
import {
  estimateRestStops,
  formatDuration,
  isLongHaul,
} from "@/lib/utils/route-planner";
import { isRoadRoute } from "@/lib/utils/route-builder";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { SaveRouteButton } from "@/components/route/SaveRouteButton";
import { MapsHandoffButtons } from "@/components/route/MapsHandoffButtons";
import { RouteTollsCard } from "@/components/route/RouteTollsCard";
import { PlanningForm, type PlanningSubmit } from "@/components/route/PlanningForm";
import { messages as m } from "@/lib/i18n";
import type { TripPlannerResult } from "@/lib/planner/types";
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
  const router = useRouter();
  const {
    activeRoute,
    tripPlan,
    setActiveRoute,
    setAlternativeRoutes,
    setTripPlan,
    setPlanDetailOpen,
    setPlanningVia,
    clearRoute,
    replanDraft,
  } = useRouteStore();
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
  const [via, setVia] = useState<RoutePoint | null>(null);
  const [routeBorders, setRouteBorders] = useState<string[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);
  const appliedReplan = useRef(0);

  useEffect(() => {
    if (!replanDraft || appliedReplan.current === replanDraft.token) return;
    appliedReplan.current = replanDraft.token;
    setOrigin(replanDraft.origin);
    setDestination(replanDraft.destination);
    setVia(replanDraft.via);
    setSelectedCorridor(null);
  }, [replanDraft]);

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
    setTripPlan(null);
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

  const runCalculation = async (corridorId: string | null, draft: PlanningSubmit) => {
    setCalculating(true);
    setRouteError(null);

    if (!origin || !destination || origin.id === destination.id) {
      setCalculating(false);
      setRouteError(
        !origin || !destination ? m.planning.missingEnds : m.planning.sameEnds
      );
      return;
    }
    setPlanDetailOpen(false);

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

    const points = corridorId
      ? undefined
      : via
        ? [origin!, via, destination!]
        : [origin!, destination!];
    const planPromise = postPlan(origin!, destination!, via, draft);
    const route = await fetchRoute({
      corridorId: corridorId ?? undefined,
      points,
    });
    const plan = await planPromise;

    if (!route && !plan) {
      setRouteError(m.planning.routeFailed);
      setCalculating(false);
      return;
    }

    if (corridor) setRouteBorders(corridor.borderIds);
    const base = route ?? shellRoute(origin!, destination!);
    const next = plan ? routeFromPlan(base, plan, via) : base;
    const keepAlternatives =
      Boolean(route) &&
      !draft.preferences.avoid_motorways &&
      !draft.preferences.avoid_tolls;
    setPlanningVia(
      via
        ? { label: via.label, lng: via.coords.lng, lat: via.coords.lat }
        : null
    );
    setTripPlan(plan);
    setActiveRoute(next);
    setAlternativeRoutes(
      keepAlternatives
        ? (route?.alternatives ?? []).map((alt) => ({
            ...next,
            id: alt.id,
            distance_km: alt.distance_km,
            duration_min: alt.duration_min,
            geometry: alt.geometry,
            alternatives: [],
          }))
        : []
    );
    if (!plan) setRouteError(m.planning.planFailed);
    if (plan) {
      setPlanDetailOpen(true);
      router.push("/");
    }
    setCalculating(false);
  };

  const longHaul = activeRoute ? isLongHaul(activeRoute.duration_min) : false;
  const restStops = activeRoute
    ? estimateRestStops(activeRoute.duration_min)
    : 0;

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={m.planning.title} subtitle={m.planning.subtitle} />

        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--waze-text-muted)]">
            {m.planning.corridors} ({TRAVEL_CORRIDORS.length})
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
                {corridor.label} · ~{corridor.estimatedHours}
                {m.planning.hoursShort}
              </button>
            ))}
          </div>
        </section>

        <PlanningForm
          origin={origin}
          destination={destination}
          via={via}
          onOrigin={(place) => {
            setOrigin(place);
            setSelectedCorridor(null);
          }}
          onDestination={(place) => {
            setDestination(place);
            setSelectedCorridor(null);
          }}
          onVia={setVia}
          calculating={calculating}
          error={routeError}
          onSubmit={(draft) => void runCalculation(selectedCorridor, draft)}
        />

        {activeRoute && (
          <div className="mt-6 space-y-4">
            <WazeCard className="border-[var(--waze-accent)]/20 bg-[var(--waze-accent-muted)]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--waze-accent-text)]">
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
                  {isRoadRoute(activeRoute.routing_source)
                    ? "по пътищата"
                    : "приблизителна оценка"}
                </span>
                {longHaul && (
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[var(--waze-warning)]">
                    {restStops + 1} почивки препоръчани
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <MapsHandoffButtons route={activeRoute} />
                <SaveRouteButton route={activeRoute} />
                {tripPlan && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlanDetailOpen(true);
                      router.push("/");
                    }}
                    className="waze-btn-secondary px-4 py-2 text-sm"
                  >
                    {m.planning.seePlan}
                  </button>
                )}
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
                    className="waze-btn-secondary border-amber-500/30 px-4 py-2 text-sm text-[var(--waze-warning)]"
                  >
                    Съвети
                  </Link>
                )}
                <button
                  onClick={clearRoute}
                  className="waze-btn-secondary px-4 py-2 text-sm text-[var(--waze-danger)]"
                >
                  Изчисти
                </button>
              </div>
            </WazeCard>

            <RouteTollsCard route={activeRoute} />

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

function postPlan(
  origin: RoutePoint,
  destination: RoutePoint,
  via: RoutePoint | null,
  draft: PlanningSubmit
): Promise<TripPlannerResult | null> {
  return fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin: planPoint(origin),
      destination: planPoint(destination),
      ...(via ? { via: [planPoint(via)] } : {}),
      ...(draft.departAt ? { depart_at: draft.departAt } : {}),
      fuel_level: draft.fuelLevel,
      preferences: draft.preferences,
    }),
  })
    .then(async (response) => {
      if (!response.ok) return null;
      return (await response.json()) as TripPlannerResult;
    })
    .catch(() => null);
}

function planPoint(place: RoutePoint) {
  return {
    label: place.label,
    lng: place.coords.lng,
    lat: place.coords.lat,
    ...(place.countryCode && place.countryCode.length === 2
      ? { country_code: place.countryCode }
      : {}),
  };
}

function shellRoute(origin: RoutePoint, destination: RoutePoint): Route {
  return {
    id: `plan-${origin.id}-${destination.id}`,
    origin: { id: origin.id, label: origin.label, coords: origin.coords },
    destination: {
      id: destination.id,
      label: destination.label,
      coords: destination.coords,
    },
    waypoints: [],
    distance_km: 0,
    duration_min: 0,
    geometry: { type: "LineString", coordinates: [] },
    alternatives: [],
  };
}

function routeFromPlan(route: Route, plan: TripPlannerResult, via: RoutePoint | null): Route {
  const border = plan.route.border_waypoint;
  return {
    ...route,
    distance_km: plan.route.distance_km,
    duration_min: plan.route.duration_min,
    geometry: plan.route.geometry,
    routing_source: plan.route.routing_source,
    waypoints: [
      ...(via
        ? [{ id: via.id, label: via.label, coords: via.coords }]
        : []),
      ...(border
        ? [
            {
              id: plan.border.chosen?.border_id ?? "border",
              label: border.label,
              coords: { lng: border.lng, lat: border.lat },
            },
          ]
        : []),
    ],
  };
}
