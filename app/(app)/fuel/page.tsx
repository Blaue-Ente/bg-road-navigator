"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

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
import { formatTemplate } from "@/lib/i18n/format-template";
import { FuelEstimateCard } from "@/components/route/FuelEstimateCard";

const DEFAULT_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

function FuelPageContent() {
  const m = useMessages();
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
  const { data, isLoading, isError, refetch, isFetching } = useFuelStations(
    bbox,
    {
      routePolyline,
    }
  );

  if (isLoading) {
    return <PageSkeleton label={m.fuelPage.loading} />;
  }

  if (isError || !data) {
    return (
      <ErrorState message={m.fuelPage.loadError} />
    );
  }

  const alongRoute = data.mode === "route";

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title={m.fuelPage.title}
          subtitle={
            alongRoute
              ? m.fuelPage.subtitleRoute
              : m.fuelPage.subtitleBulgaria
          }
        />

        {wantRoute && !activeRoute && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              {m.fuelPage.noActiveRoute}
            </p>
          </WazeCard>
        )}

        {data.degraded && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              {m.fuelPage.degraded}
            </p>
          </WazeCard>
        )}

        {activeRoute && (
          <div className="mb-4">
            <FuelEstimateCard distanceKm={activeRoute.distance_km} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-8">
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">
              {formatTemplate(m.fuelPage.sectionHeading, {
                label: m.fuelPage.stations,
                count: String(data.fuelStations.length),
              })}
            </h2>
            <div className="space-y-3">
              {data.fuelStations.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-[var(--waze-text-secondary)]">
                    {m.fuelPage.emptyStations}
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                    className="waze-btn-secondary min-h-11 px-4 text-sm"
                  >
                    {isFetching ? m.fuelPage.retrying : m.fuelPage.retry}
                  </button>
                </div>
              ) : (
                data.fuelStations.map((station) => (
                  <FuelStationCard key={station.id} station={station} />
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">
              {formatTemplate(m.fuelPage.sectionHeading, {
                label: m.fuelPage.ev,
                count: String(data.evStations.length),
              })}
            </h2>
            <div className="space-y-3">
              {data.evStations.length === 0 ? (
                <p className="text-sm text-[var(--waze-text-secondary)]">{m.fuelPage.emptyEv}</p>
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
  const m = useMessages();
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[var(--waze-accent-text)]">{m.fuelPage.suspense}</div>
      }
    >
      <FuelPageContent />
    </Suspense>
  );
}
