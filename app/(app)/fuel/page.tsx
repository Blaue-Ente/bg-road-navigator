"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useFuelStations } from "@/lib/hooks/useFuelStations";
import { useRouteStore } from "@/lib/stores/route.store";
import { FuelStationCard } from "@/components/fuel/FuelStationCard";
import { EVChargerCard } from "@/components/fuel/EVChargerCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { PageSkeleton, ErrorState } from "@/components/ui/PageSkeleton";
import { sampleRouteCoordinates } from "@/lib/utils/route-fuel-sample";
import { FuelEstimateCard } from "@/components/route/FuelEstimateCard";

const DEFAULT_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

function FuelPageContent() {
  const searchParams = useSearchParams();
  const wantRoute = searchParams.get("route") === "1";
  const activeRoute = useRouteStore((s) => s.activeRoute);

  const routePolyline = useMemo(() => {
    if (!wantRoute || !activeRoute?.geometry?.coordinates?.length)
      return undefined;
    // Downsample for the query string
    const samples = sampleRouteCoordinates(
      activeRoute.geometry.coordinates as [number, number][],
      100,
      10
    );
    return samples
      .map((p) => `${p.lng.toFixed(4)},${p.lat.toFixed(4)}`)
      .join(";");
  }, [wantRoute, activeRoute]);

  const bbox = routePolyline ? undefined : DEFAULT_BBOX;
  const { data, isLoading, isError } = useFuelStations(bbox, {
    routePolyline,
  });

  if (isLoading) {
    return <PageSkeleton label="Зареждане на гориво" />;
  }

  if (isError || !data) {
    return (
      <ErrorState message="Не може да се заредят данните за гориво и зарядка." />
    );
  }

  const alongRoute = data.mode === "route";

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Гориво и зарядка"
          subtitle={
            alongRoute
              ? "Станции по активния маршрут"
              : "Бензиностанции и зарядни точки около България"
          }
        />

        {wantRoute && !activeRoute && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              Няма активен маршрут. Изчислете маршрут или разгледайте станции в
              България.
            </p>
          </WazeCard>
        )}

        {data.degraded && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-muted)]">
              Списъкът със станции е ограничен в момента. Оценката на разхода
              по-долу остава налична.
            </p>
          </WazeCard>
        )}

        {activeRoute && (
          <div className="mb-4">
            <FuelEstimateCard distanceKm={activeRoute.distance_km} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
              Бензиностанции
              <span className="ml-2 text-[var(--waze-text-muted)]">
                ({data.fuelStations.length})
              </span>
            </h2>
            <div className="space-y-3">
              {data.fuelStations.length === 0 ? (
                <p className="text-sm text-[var(--waze-text-muted)]">
                  Няма потвърдени данни за бензиностанции в този район в
                  момента.
                </p>
              ) : (
                data.fuelStations.map((station) => (
                  <FuelStationCard key={station.id} station={station} />
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
              EV зарядни
              <span className="ml-2 text-[var(--waze-text-muted)]">
                ({data.evStations.length})
              </span>
            </h2>
            <div className="space-y-3">
              {data.evStations.length === 0 ? (
                <p className="text-[var(--waze-text-muted)]">
                  Няма потвърдени EV станции в този район в момента.
                </p>
              ) : (
                data.evStations.map((station) => (
                  <EVChargerCard key={station.id} station={station} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function FuelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[var(--waze-accent)]">
          Зареждане...
        </div>
      }
    >
      <FuelPageContent />
    </Suspense>
  );
}
