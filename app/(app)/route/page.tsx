"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCityById } from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { toDatetimeLocalValue } from "@/lib/planner/form-preferences";
import { proposedDepartLocalValue } from "@/lib/planner/proposed-depart";
import { formatClockDuration } from "@/lib/planner/itinerary";
import {
  createPlannerDraft,
  patchPlannerDraft,
  type PlannerDraft,
} from "@/lib/planner/planner-draft";
import { resolveTripPreferences } from "@/lib/planner/preferences";
import {
  hydratePlannerDraft,
  usePlannerDraftStore,
} from "@/lib/stores/planner-draft.store";
import { useRouteStore } from "@/lib/stores/route.store";
import { useUserStore } from "@/lib/stores/user.store";
import { estimateRestStops, isLongHaul } from "@/lib/utils/route-planner";
import { isRoadRoute } from "@/lib/utils/route-builder";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { WazeCard } from "@/components/ui/WazeCard";
import { SaveRouteButton } from "@/components/route/SaveRouteButton";
import { MapsHandoffButtons } from "@/components/route/MapsHandoffButtons";
import { RouteTollsCard } from "@/components/route/RouteTollsCard";
import { PlanningForm, type PlanningSubmit } from "@/components/route/PlanningForm";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { formatTemplate } from "@/lib/i18n/format-template";
import { committedPlace } from "@/lib/route/place-commit";
import { applyPlanRouteOptions } from "@/components/plan/RouteChoiceCards";
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
  const m = useMessages();
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
    setReplanDraft,
  } = useRouteStore();
  const profilePrefs = useUserStore((state) => state.profile?.trip_preferences);
  const storedDraft = usePlannerDraftStore((state) => state.draft);
  const setStoredDraft = usePlannerDraftStore((state) => state.setDraft);
  const clearStoredDraft = usePlannerDraftStore((state) => state.clearDraft);
  const [ready, setReady] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [routeBorders, setRouteBorders] = useState<string[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [viaQuery, setViaQuery] = useState("");
  const appliedReplan = useRef(0);

  const blank = useMemo(
    () =>
      createPlannerDraft({
        origin: activeRoute
          ? { ...activeRoute.origin, source: "user" }
          : null,
        destination: activeRoute
          ? { ...activeRoute.destination, source: "user" }
          : null,
        preferences: resolveTripPreferences(undefined, profilePrefs),
        departLocal:
          toDatetimeLocalValue(profilePrefs?.depart_at) ||
          proposedDepartLocalValue(),
      }),
    [activeRoute, profilePrefs]
  );
  const draft = storedDraft ?? blank;
  const { origin, destination, via } = draft;
  const selectedCorridor = draft.corridorId;

  useEffect(() => {
    hydratePlannerDraft();
    queueMicrotask(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !replanDraft || appliedReplan.current === replanDraft.token) {
      return;
    }
    appliedReplan.current = replanDraft.token;
    setStoredDraft(
      createPlannerDraft({
        origin: replanDraft.origin,
        destination: replanDraft.destination,
        via: replanDraft.via,
        preferences: resolveTripPreferences(replanDraft.preferences),
        departLocal: toDatetimeLocalValue(replanDraft.departAt),
        fuelPercent: Math.round(replanDraft.fuelLevel * 100),
      })
    );
    setReplanDraft(null);
  }, [ready, replanDraft, setReplanDraft, setStoredDraft]);

  const commit = (partial: Partial<PlannerDraft>) => {
    const base = usePlannerDraftStore.getState().draft ?? blank;
    setStoredDraft(patchPlannerDraft(base, partial));
  };

  const resetDraft = () => {
    setRouteError(null);
    setRouteBorders([]);
    setStoredDraft(
      createPlannerDraft({
        preferences: resolveTripPreferences(undefined, profilePrefs),
        departLocal:
          toDatetimeLocalValue(profilePrefs?.depart_at) ||
          proposedDepartLocalValue(),
      })
    );
  };

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

    const first = toRoutePoint(corridor.cityIds[0]!);
    const last = toRoutePoint(corridor.cityIds[corridor.cityIds.length - 1]!);
    commit({
      corridorId,
      ...(first ? { origin: first } : {}),
      ...(last ? { destination: last } : {}),
    });
    setRouteBorders(corridor.borderIds);
  };

  const runCalculation = async (corridorId: string | null, submitted: PlanningSubmit) => {
    setCalculating(true);
    setRouteError(null);

    const committedOrigin = committedPlace(origin, originQuery);
    const committedDestination = committedPlace(destination, destinationQuery);
    const committedVia = via ? committedPlace(via, viaQuery) : null;

    if (!committedOrigin || !committedDestination) {
      setCalculating(false);
      setRouteError(m.planning.pickFromList);
      return;
    }
    if (committedOrigin.id === committedDestination.id) {
      setCalculating(false);
      setRouteError(m.planning.sameEnds);
      return;
    }
    setPlanDetailOpen(false);

    const corridor = corridorId
      ? TRAVEL_CORRIDORS.find((c) => c.id === corridorId)
      : null;

    if (corridor) setRouteBorders(corridor.borderIds);
    else setRouteBorders([]);

    const points = corridorId
      ? undefined
      : committedVia
        ? [committedOrigin, committedVia, committedDestination]
        : [committedOrigin, committedDestination];
    const planPromise = postPlan(
      committedOrigin,
      committedDestination,
      committedVia,
      submitted
    );
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
    const base = route ?? shellRoute(committedOrigin, committedDestination);
    const next = plan ? routeFromPlan(base, plan, committedVia) : base;
    setPlanningVia(
      committedVia
        ? {
            label: committedVia.label,
            lng: committedVia.coords.lng,
            lat: committedVia.coords.lat,
          }
        : null
    );
    setTripPlan(plan);
    setActiveRoute(next);
    if (plan) applyPlanRouteOptions(plan, next, setAlternativeRoutes);
    else setAlternativeRoutes([]);
    if (!plan) setRouteError(m.planning.planFailed);
    if (plan) {
      clearStoredDraft();
      setPlanDetailOpen(true);
      router.push("/");
    }
    setCalculating(false);
  };

  const longHaul = activeRoute ? isLongHaul(activeRoute.duration_min) : false;
  const restStops = activeRoute
    ? estimateRestStops(activeRoute.duration_min)
    : 0;

  if (!ready) return <PageSkeleton label={m.planning.title} />;

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader title={m.planning.title} subtitle={m.planning.subtitle} />

        <PlanningForm
          draft={draft}
          onChange={commit}
          onReset={resetDraft}
          calculating={calculating}
          error={routeError}
          onSubmit={(submitted) => void runCalculation(selectedCorridor, submitted)}
          originQuery={originQuery}
          destinationQuery={destinationQuery}
          onOriginQueryChange={setOriginQuery}
          onDestinationQueryChange={setDestinationQuery}
          onViaQueryChange={setViaQuery}
        />

        <details className="mb-6">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--waze-text)]">
            {m.planning.corridors} ({TRAVEL_CORRIDORS.length})
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRAVEL_CORRIDORS.map((corridor) => (
              <button
                key={corridor.id}
                type="button"
                onClick={() => handleCorridorSelect(corridor.id)}
                className={`waze-chip min-h-11 text-sm ${
                  selectedCorridor === corridor.id ? "waze-chip-active" : ""
                }`}
              >
                {corridor.label}
              </button>
            ))}
          </div>
        </details>

        {activeRoute && (
          <div className="mt-6 space-y-4">
            <WazeCard className="border-[var(--waze-accent)]/20 bg-[var(--waze-accent-muted)]">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--waze-accent-text)]">{m.routePage.msgff9002efe3}</h2>
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
                  {formatClockDuration(activeRoute.duration_min)}
                </span>
                <span className="rounded-full bg-[var(--waze-surface-elevated)] px-3 py-1 text-xs">
                  {isRoadRoute(activeRoute.routing_source)
                    ? m.routePage.msg9cdf228300
                    : m.routePage.msga2f81ebcc5}
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
                <Link href="/" className="waze-btn-secondary px-4 py-2 text-sm">{m.routePage.msg36cce9dd24}</Link>
                <Link
                  href={`/borders?route=1${routeBorders.length ? `&border_ids=${routeBorders.join(",")}` : ""}`}
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >
                  {formatTemplate(m.routePage.bordersNav, {
                    count: routeBorders.length || m.routePage.msg5957d3869f,
                  })}
                </Link>
                <Link
                  href="/weather"
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >{m.routePage.msga4bfab2fea}</Link>
                <Link
                  href="/fuel?route=1"
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >{m.routePage.msgfe32ebb56c}</Link>
                <Link
                  href={
                    selectedCorridor
                      ? `/hotels?corridor=${selectedCorridor}`
                      : "/hotels"
                  }
                  className="waze-btn-secondary px-4 py-2 text-sm"
                >{m.nav.hotels}</Link>
                {longHaul && (
                  <Link
                    href="/tips"
                    className="waze-btn-secondary border-amber-500/30 px-4 py-2 text-sm text-[var(--waze-warning)]"
                  >{m.nav.tips}</Link>
                )}
                <button
                  onClick={clearRoute}
                  className="waze-btn-secondary px-4 py-2 text-sm text-[var(--waze-danger)]"
                >{m.routePage.msg72cdd825c4}</button>
              </div>
            </WazeCard>

            <RouteTollsCard route={activeRoute} />

            {activeRoute.alternatives.length > 0 && (
              <WazeCard>
                <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
                  {formatTemplate(m.routePage.alternativesTitle, {
                    count: activeRoute.alternatives.length,
                  })}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {activeRoute.alternatives.map((alt, index) => (
                    <button
                      key={alt.id}
                      type="button"
                      onClick={() => promoteAlternative(alt)}
                      className="waze-chip"
                    >
                      {formatTemplate(m.routePage.alternativeVariant, {
                        index: index + 1,
                        distance: alt.distance_km,
                        duration: formatClockDuration(alt.duration_min),
                      })}
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
                  {formatTemplate(m.routePage.bordersAlongRouteTitle, {
                    count: routeBorders.length,
                  })}
                </h3>
                <p className="text-xs text-[var(--waze-text-muted)]">
                  {m.routePage.msgd4607302de}
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
