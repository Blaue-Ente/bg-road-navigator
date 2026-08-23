"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Map } from "maplibre-gl";
import { useRouteStore } from "@/lib/stores/route.store";
import { formatDuration } from "@/lib/utils/route-planner";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { useTraffic } from "@/lib/hooks/useTraffic";
import {
  DEFAULT_COMMUNITY_BBOX,
  useCommunityPins,
} from "@/lib/hooks/useCommunityPins";
import { useCommunityStore } from "@/lib/stores/community.store";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { MapControls } from "@/components/map/MapControls";
import { RouteLayer } from "@/components/map/RouteLayer";
import { RouteBottomSheet } from "@/components/map/RouteBottomSheet";
import { TrafficLayer } from "@/components/map/TrafficLayer";
import { CommunityPins } from "@/components/map/CommunityPins";
import { PinDropButton } from "@/components/community/PinDropButton";
import { PinComposer } from "@/components/community/PinComposer";
import { SearchIcon } from "@/components/icons/NavIcons";
import { fitMapToRoute } from "@/lib/map/apply-waze-style";
import { goHomeErrorMessage, useGoHome } from "@/lib/hooks/useGoHome";
import { getHomeCity } from "@/lib/constants/european-cities";
import { useHomeStore } from "@/lib/stores/home.store";

const MapCanvas = dynamic(
  () => import("@/components/map/MapCanvas").then((m) => m.MapCanvas),
  { ssr: false, loading: () => <MapFallback /> }
);

const BULGARIA_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

function MapFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-[var(--waze-bg)] text-[var(--waze-text-muted)]">
      Зареждане на картата...
    </div>
  );
}

export default function MapPage() {
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const alternativeRoutes = useRouteStore((s) => s.alternativeRoutes);
  const localPins = useCommunityStore((s) => s.pins);
  const isDropMode = useCommunityStore((s) => s.isDropMode);
  const dropCoords = useCommunityStore((s) => s.dropCoords);
  const setDropCoords = useCommunityStore((s) => s.setDropCoords);
  const { data: borders } = useBorderStatus({ region: "bulgaria" });
  const { data: traffic } = useTraffic(BULGARIA_BBOX, 7);
  const { data: communityData } = useCommunityPins({
    bbox: DEFAULT_COMMUNITY_BBOX,
  });
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const homeCityId = useHomeStore((s) => s.homeCityId);
  const homeCity = getHomeCity(homeCityId);
  const { goHome, busy: goingHome, error: goHomeError } = useGoHome();

  const communityPins = communityData?.pins ?? localPins;

  const handleMapLoad = useCallback((map: Map) => {
    setMapInstance(map);
  }, []);

  const handleMapClick = useCallback(
    (coords: { lng: number; lat: number }) => {
      if (!isDropMode) return;
      // Accept tap while waiting for a location, or when user asked to retap.
      if (!dropCoords) {
        setDropCoords(coords);
      }
    },
    [isDropMode, dropCoords, setDropCoords]
  );

  useEffect(() => {
    if (!mapInstance || !activeRoute?.geometry?.coordinates?.length) return;
    fitMapToRoute(
      mapInstance,
      activeRoute.geometry.coordinates as [number, number][]
    );
  }, [mapInstance, activeRoute]);

  const topBorders = borders?.slice(0, 4) ?? [];
  const incidentCount = traffic?.incidents?.length ?? 0;
  const borderBottom = activeRoute
    ? "calc(11.5rem + env(safe-area-inset-bottom, 0px))"
    : "calc(5.75rem + env(safe-area-inset-bottom, 0px))";

  return (
    <div className="relative h-full">
      <MapCanvas
        onMapLoad={handleMapLoad}
        onMapClick={handleMapClick}
        dropMode={isDropMode && !dropCoords}
        className="h-full"
        wazeTheme
      />
      <MapControls map={mapInstance} />
      <RouteLayer
        map={mapInstance}
        route={activeRoute}
        alternatives={alternativeRoutes}
      />
      <TrafficLayer map={mapInstance} incidents={traffic?.incidents} />
      <CommunityPins map={mapInstance} pins={communityPins} />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <Link
          href="/route"
          className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-full waze-panel px-4 py-3 transition hover:scale-[1.01] active:scale-[0.99]"
        >
          <SearchIcon className="shrink-0 text-[var(--waze-accent)]" />
          <div className="min-w-0 flex-1">
            {activeRoute ? (
              <>
                <p className="truncate text-sm font-semibold text-[var(--waze-text)]">
                  {activeRoute.origin.label} → {activeRoute.destination.label}
                </p>
                <p className="truncate text-xs text-[var(--waze-text-muted)]">
                  {activeRoute.distance_km} км ·{" "}
                  {formatDuration(activeRoute.duration_min)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--waze-text)]">
                  Къде отивате?
                </p>
                <p className="text-xs text-[var(--waze-text-muted)]">
                  Или се приберете в {homeCity.label}
                </p>
              </>
            )}
          </div>
          <span className="waze-btn-primary shrink-0 px-4 py-2 text-xs">
            {activeRoute ? "План" : "Тръгни"}
          </span>
        </Link>

        {!activeRoute && (
          <button
            type="button"
            onClick={() => void goHome()}
            disabled={goingHome}
            className="pointer-events-auto mx-auto mt-2 flex max-w-lg items-center justify-center rounded-full waze-panel px-4 py-2.5 text-sm font-semibold text-[var(--waze-accent)] disabled:opacity-50"
          >
            {goingHome
              ? "Търся пътя към вкъщи…"
              : `Прибери ме в ${homeCity.label}`}
          </button>
        )}
        {goHomeError && !activeRoute && (
          <p className="pointer-events-auto mx-auto mt-2 max-w-lg rounded-2xl bg-red-500/15 px-3 py-2 text-center text-xs text-red-200">
            {goHomeErrorMessage(goHomeError)}
          </p>
        )}

        {isDropMode && !dropCoords && (
          <div className="pointer-events-none mx-auto mt-3 max-w-lg rounded-full bg-[var(--waze-accent)] px-4 py-2 text-center text-sm font-semibold text-[#0b0f14] shadow-lg">
            Докоснете картата за позиция на сигнала
          </div>
        )}
      </div>

      <div
        className="absolute inset-x-0 z-10 px-3 transition-all duration-300"
        style={{ bottom: borderBottom }}
      >
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto pb-1">
          {topBorders.map((border) => (
            <Link
              key={border.crossing_id}
              href="/borders"
              className="waze-panel shrink-0 px-3 py-2 transition hover:scale-[1.02]"
            >
              <p className="mb-1 max-w-[120px] truncate text-[11px] font-medium text-[var(--waze-text-secondary)]">
                {border.name_bg}
              </p>
              <BorderWaitBadge waitMinutes={border.wait_time_cars} compact />
            </Link>
          ))}
          {incidentCount > 0 && (
            <div className="waze-panel shrink-0 border-orange-500/30 bg-orange-500/10 px-3 py-2">
              <p className="text-xs font-medium text-orange-300">
                ⚠ {incidentCount} инцидента
              </p>
            </div>
          )}
          {communityPins.length > 0 && (
            <Link
              href="/community"
              className="waze-panel shrink-0 px-3 py-2 transition hover:scale-[1.02]"
            >
              <p className="text-xs font-medium text-[var(--waze-accent)]">
                📣 {communityPins.length} сигнала
              </p>
            </Link>
          )}
        </div>
      </div>

      {activeRoute && <RouteBottomSheet route={activeRoute} />}
      <PinDropButton mode="map" />
      <PinComposer requireMapTap />
    </div>
  );
}
