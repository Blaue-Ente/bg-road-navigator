"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useFuelStations } from "@/lib/hooks/useFuelStations";
import { useRouteStore } from "@/lib/stores/route.store";
import { FuelStationCard } from "@/components/fuel/FuelStationCard";
import { EVChargerCard } from "@/components/fuel/EVChargerCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { sampleRouteCoordinates } from "@/lib/utils/route-fuel-sample";
import { formatTemplate } from "@/lib/i18n/format-template";
import Link from "next/link";
import { FuelEstimateCard } from "@/components/route/FuelEstimateCard";
import {
  fuelPageUsesBulgariaSubtitle,
  fuelPageViewModel,
} from "@/lib/fuel/fuel-page-view";

const DEFAULT_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

function FuelPageShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: ReactNode;
}) {
  const m = useMessages();
  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader title={m.fuelPage.title} subtitle={subtitle} />
        {children}
      </div>
    </div>
  );
}

function FuelPageContent() {
  const m = useMessages();
  const searchParams = useSearchParams();
  const wantRoute = searchParams.get("route") === "1";
  const activeRoute = useRouteStore((s) => s.activeRoute);

  const routePolyline = useMemo(() => {
    if (!wantRoute || !activeRoute?.geometry?.coordinates?.length)
      return undefined;
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
    const view = fuelPageViewModel({ fetchStatus: "error", stationCount: 0 });
    return (
      <FuelPageShell subtitle={m.fuelPage.subtitleBulgaria}>
        <WazeCard className="space-y-3 p-4">
          <p className="text-sm text-[var(--waze-text-secondary)]">
            {m.fuelPage.unavailable}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="waze-btn-secondary min-h-11 px-4 text-sm"
            >
              {isFetching ? m.fuelPage.retrying : m.fuelPage.retry}
            </button>
            {view.showPlanLink ? (
              <Link
                href="/route"
                className="waze-btn-primary inline-flex min-h-11 items-center px-4 text-sm"
              >
                {m.fuelPage.planRouteLink}
              </Link>
            ) : null}
          </div>
        </WazeCard>
      </FuelPageShell>
    );
  }

  const alongRoute = data.mode === "route";
  const centerLat = data.bbox ? (data.bbox.s + data.bbox.n) / 2 : 42.7;
  const centerLng = data.bbox ? (data.bbox.w + data.bbox.e) / 2 : 23.32;
  const subtitle = alongRoute
    ? m.fuelPage.subtitleRoute
    : fuelPageUsesBulgariaSubtitle(data.mode, centerLat, centerLng)
      ? m.fuelPage.subtitleBulgaria
      : m.fuelPage.subtitleNearPlace;
  const view = fuelPageViewModel({
    fetchStatus: "ok",
    stationCount: data.fuelStations.length,
    degraded: data.degraded,
  });
  const emptyMessage =
    view.emptyCopyKey === "unavailable"
      ? m.fuelPage.unavailable
      : view.emptyCopyKey === "noneHere"
        ? m.fuelPage.noneHere
        : null;

  return (
    <FuelPageShell subtitle={subtitle}>
      {wantRoute && !activeRoute && (
        <WazeCard className="mb-4">
          <p className="text-sm text-[var(--waze-text-secondary)]">
            {m.fuelPage.noActiveRoute}
          </p>
        </WazeCard>
      )}

      {data.degraded && data.fuelStations.length > 0 && (
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
                  {emptyMessage ?? m.fuelPage.emptyStations}
                </p>
                <div className="flex flex-wrap gap-2">
                  {view.showRetry ? (
                    <button
                      type="button"
                      onClick={() => void refetch()}
                      disabled={isFetching}
                      className="waze-btn-secondary min-h-11 px-4 text-sm"
                    >
                      {isFetching ? m.fuelPage.retrying : m.fuelPage.retry}
                    </button>
                  ) : null}
                  {view.showPlanLink ? (
                    <Link
                      href="/route"
                      className="waze-btn-primary inline-flex min-h-11 items-center px-4 text-sm"
                    >
                      {m.fuelPage.planRouteLink}
                    </Link>
                  ) : null}
                </div>
                {view.showPlanLink ? (
                  <p className="text-xs text-[var(--waze-text-muted)]">
                    {m.fuelPage.planRouteHint}
                  </p>
                ) : null}
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
              <p className="text-sm text-[var(--waze-text-secondary)]">
                {m.fuelPage.emptyEv}
              </p>
            ) : (
              data.evStations.map((station) => (
                <EVChargerCard key={station.id} station={station} />
              ))
            )}
          </div>
        </section>
      </div>
    </FuelPageShell>
  );
}

export default function FuelPage() {
  const m = useMessages();
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-[var(--waze-accent-text)]">
          {m.fuelPage.suspense}
        </div>
      }
    >
      <FuelPageContent />
    </Suspense>
  );
}