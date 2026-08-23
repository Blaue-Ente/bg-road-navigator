"use client";

import { useState } from "react";
import Link from "next/link";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { getCityById } from "@/lib/constants/european-cities";
import { useCalculateRoute } from "@/lib/hooks/useCalculateRoute";
import {
  goHomeErrorMessage,
  useGoHome,
} from "@/lib/hooks/useGoHome";
import { useHomeStore } from "@/lib/stores/home.store";
import { useRouteStore } from "@/lib/stores/route.store";
import { homeCityToRoutePoint } from "@/lib/utils/home-briefing";
import {
  estimateRestStops,
  formatDuration,
  isLongHaul,
} from "@/lib/utils/route-planner";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { LocationSearchInput } from "@/components/route/LocationSearchInput";
import { SaveRouteButton } from "@/components/route/SaveRouteButton";
import { HomeBriefingCard } from "@/components/route/HomeBriefingCard";
import { HomeCityPicker } from "@/components/route/HomeCityPicker";
import { TripPlanCard } from "@/components/trips/TripPlanCard";
import type { Route, RouteAlternative, RoutePoint } from "@/types/route.types";

function toRoutePoint(cityId: string): RoutePoint | null {
  const city = getCityById(cityId);
  if (!city) return null;

  return {
    id: city.id,
    label: city.label,
    subtitle: city.country,
    coords: city.coords,
    source: "curated",
  };
}

const HOMEBOUND_CORRIDORS = TRAVEL_CORRIDORS.filter((corridor) => {
  const last = corridor.cityIds[corridor.cityIds.length - 1];
  return last === "sofia" || last === "plovdiv";
});

const FEATURED_HOMEBOUND_IDS = [
  "munich-sofia",
  "vienna-sofia",
  "berlin-sofia",
  "istanbul-sofia",
  "athens-sofia",
  "paris-sofia",
];

const FEATURED_CORRIDORS = FEATURED_HOMEBOUND_IDS.map((id) =>
  HOMEBOUND_CORRIDORS.find((corridor) => corridor.id === id)
).filter((corridor): corridor is (typeof HOMEBOUND_CORRIDORS)[number] =>
  Boolean(corridor)
);

export default function RoutePage() {
  const { activeRoute, setActiveRoute, setAlternativeRoutes, clearRoute } =
    useRouteStore();
  const homeCityId = useHomeStore((s) => s.homeCityId);
  const { calculate, calculating, error, setError } = useCalculateRoute();
  const {
    goHome,
    resolveGps,
    busy: goingHome,
    error: goHomeError,
    setError: setGoHomeError,
  } = useGoHome();

  const [origin, setOrigin] = useState<RoutePoint | null>(() =>
    activeRoute ? { ...activeRoute.origin, source: "user" } : null
  );
  const [destination, setDestination] = useState<RoutePoint | null>(() =>
    activeRoute
      ? { ...activeRoute.destination, source: "user" }
      : homeCityToRoutePoint(homeCityId)
  );
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(
    () => activeRoute?.corridor_id ?? null
  );
  const [locatingOrigin, setLocatingOrigin] = useState(false);
  const [showCorridors, setShowCorridors] = useState(false);

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
      id: `route-alt-${alt.id}`,
      distance_km: alt.distance_km,
      duration_min: alt.duration_min,
      geometry: alt.geometry,
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

  const handleCorridorSelect = async (corridorId: string) => {
    const corridor = TRAVEL_CORRIDORS.find((c) => c.id === corridorId);
    if (!corridor) return;

    setSelectedCorridor(corridorId);
    const first = toRoutePoint(corridor.cityIds[0]!);
    const last = toRoutePoint(corridor.cityIds[corridor.cityIds.length - 1]!);
    if (first) setOrigin(first);
    if (last) setDestination(last);
    setError(null);
    setGoHomeError(null);
    await calculate({ corridorId });
  };

  const runCalculation = async (corridorId?: string | null) => {
    if (!corridorId && (!origin || !destination)) {
      setError("Изберете начална и крайна точка от резултатите.");
      return;
    }

    if (!corridorId && origin?.id === destination?.id) {
      setError("Началната и крайната точка трябва да са различни.");
      return;
    }

    if (corridorId) setSelectedCorridor(corridorId);
    else setSelectedCorridor(null);

    await calculate({
      corridorId: corridorId ?? undefined,
      points: corridorId ? undefined : [origin!, destination!],
    });
  };

  const fillOriginFromGps = async () => {
    setLocatingOrigin(true);
    setError(null);
    const place = await resolveGps();
    setLocatingOrigin(false);
    if (!place) {
      setError(
        "Не успяхме да вземем локацията. Разрешете достъп или потърсете град."
      );
      return;
    }
    setOrigin(place);
    setSelectedCorridor(null);
  };

  const swapEnds = () => {
    setOrigin(destination);
    setDestination(origin);
    setSelectedCorridor(null);
  };

  const handleGoHome = async () => {
    const result = await goHome();
    if (result.origin) {
      setOrigin(result.origin);
      setDestination(homeCityToRoutePoint(homeCityId));
      setSelectedCorridor(null);
    }
  };

  const longHaul = activeRoute ? isLongHaul(activeRoute.duration_min) : false;
  const restStops = activeRoute
    ? estimateRestStops(activeRoute.duration_min)
    : 0;
  const formError = error ?? goHomeErrorMessage(goHomeError);
  const busy = calculating || goingHome;

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Път към вкъщи"
          subtitle="Едно докосване от вашата позиция — или изберете град. Ще получите ясен план: граници, винетки, почивки и кога да тръгнете."
        />

        <WazeCard className="mb-4 space-y-3">
          <HomeCityPicker
            onSelect={(cityId) => {
              if (!activeRoute) setDestination(homeCityToRoutePoint(cityId));
            }}
          />
          <button
            type="button"
            onClick={() => void handleGoHome()}
            disabled={busy}
            className="waze-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
          >
            {goingHome ? "Търся пътя към вкъщи…" : "Прибери ме вкъщи"}
          </button>
          <p className="text-xs leading-relaxed text-[var(--waze-text-muted)]">
            Взема текущата ви позиция и смята най-прекия път към{" "}
            {homeCityToRoutePoint(homeCityId).label}. После казва какво да
            направите преди да тръгнете.
          </p>
        </WazeCard>

        <WazeCard className="space-y-4">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <LocationSearchInput
                id="origin"
                label="Откъде тръгвате"
                value={origin}
                placeholder="Град, адрес или хотел в Европа"
                onSelect={(place) => {
                  setOrigin(place);
                  setSelectedCorridor(null);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => void fillOriginFromGps()}
              disabled={locatingOrigin || busy}
              className="mb-0.5 shrink-0 rounded-xl px-3 py-3 text-xs font-medium text-[var(--waze-accent)] disabled:opacity-50"
            >
              {locatingOrigin ? "…" : "Моята локация"}
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={swapEnds}
              className="rounded-full bg-[var(--waze-surface-elevated)] px-3 py-1.5 text-xs text-[var(--waze-text-secondary)]"
              aria-label="Размени начална и крайна точка"
            >
              ↕ Размени
            </button>
          </div>

          <LocationSearchInput
            id="destination"
            label="Накъде"
            value={destination}
            placeholder="По подразбиране — вкъщи"
            onSelect={(place) => {
              setDestination(place);
              setSelectedCorridor(null);
            }}
          />

          {formError && <p className="text-sm text-red-400">{formError}</p>}

          <button
            type="button"
            onClick={() => void runCalculation(selectedCorridor)}
            disabled={
              busy ||
              (!selectedCorridor &&
                (!origin || !destination || origin.id === destination.id))
            }
            className="waze-btn-primary w-full py-3.5 text-sm disabled:opacity-50"
          >
            {calculating ? "Изчисляване по пътища..." : "Изчисли този маршрут"}
          </button>
        </WazeCard>

        <section className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--waze-text-muted)]">
            Често към вкъщи — докоснете и тръгва изчислението
          </p>
          <div className="flex flex-wrap gap-2">
            {FEATURED_CORRIDORS.map((corridor) => (
              <button
                key={corridor.id}
                type="button"
                disabled={busy}
                onClick={() => void handleCorridorSelect(corridor.id)}
                className={`waze-chip ${
                  selectedCorridor === corridor.id ? "waze-chip-active" : ""
                }`}
              >
                {corridor.label} · ~{corridor.estimatedHours}ч
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowCorridors((open) => !open)}
            className="mt-3 text-xs font-semibold text-[var(--waze-text-muted)]"
          >
            {showCorridors ? "▾ По-малко" : "▸ Още коридори"}
          </button>
          {showCorridors && (
            <div className="mt-2 flex flex-wrap gap-2">
              {HOMEBOUND_CORRIDORS.filter(
                (corridor) => !FEATURED_HOMEBOUND_IDS.includes(corridor.id)
              ).map((corridor) => (
                <button
                  key={corridor.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCorridorSelect(corridor.id)}
                  className={`waze-chip ${
                    selectedCorridor === corridor.id ? "waze-chip-active" : ""
                  }`}
                >
                  {corridor.label} · ~{corridor.estimatedHours}ч
                </button>
              ))}
            </div>
          )}
        </section>

        {activeRoute && (
          <div className="mt-6 space-y-4">
            <HomeBriefingCard route={activeRoute} />

            <WazeCard>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-[var(--waze-text-secondary)]">
                  {activeRoute.distance_km} км ·{" "}
                  {formatDuration(activeRoute.duration_min)}
                  {activeRoute.routing_source === "osrm"
                    ? " · реални пътища"
                    : " · приблизителна оценка"}
                  {longHaul
                    ? ` · ${restStops + 1} почивки`
                    : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  <SaveRouteButton route={activeRoute} />
                  <button
                    type="button"
                    onClick={clearRoute}
                    className="waze-btn-secondary px-3 py-2 text-sm text-red-400"
                  >
                    Изчисти
                  </button>
                </div>
              </div>
            </WazeCard>

            {activeRoute.alternatives.length > 0 && (
              <WazeCard>
                <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
                  По-къс или по-свободен вариант?
                </h3>
                <p className="mb-3 text-xs text-[var(--waze-text-muted)]">
                  Изберете алтернатива, ако искате да избегнете натоварен
                  участък. Времето е чисто шофиране — без опашки на граница.
                </p>
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

            <p className="pb-2 text-center text-xs text-[var(--waze-text-muted)]">
              <Link href="/emergency" className="text-[var(--waze-accent)]">
                Спешни телефони по пътя
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
