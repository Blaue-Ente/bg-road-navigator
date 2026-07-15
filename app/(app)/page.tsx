"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Map as MapboxMap } from "mapbox-gl";
import { useRouteStore } from "@/lib/stores/route.store";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { useTraffic } from "@/lib/hooks/useTraffic";
import { useCommunityStore } from "@/lib/stores/community.store";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { MapControls } from "@/components/map/MapControls";
import { RouteLayer } from "@/components/map/RouteLayer";
import { TrafficLayer } from "@/components/map/TrafficLayer";
import { CommunityPins } from "@/components/map/CommunityPins";

const MapCanvas = dynamic(
  () => import("@/components/map/MapCanvas").then((m) => m.MapCanvas),
  { ssr: false, loading: () => <MapFallback /> }
);

const BULGARIA_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

function MapFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-gray-900 text-gray-400">
      Зареждане на картата...
    </div>
  );
}

export default function MapPage() {
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const communityPins = useCommunityStore((s) => s.pins);
  const { data: borders } = useBorderStatus();
  const { data: traffic } = useTraffic(BULGARIA_BBOX, 7);
  const [mapInstance, setMapInstance] = useState<MapboxMap | null>(null);
  const hasMapboxToken = !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleMapLoad = useCallback((map: MapboxMap) => {
    setMapInstance(map);
  }, []);

  const topBorders = borders?.slice(0, 3) ?? [];
  const incidentCount = traffic?.incidents?.length ?? 0;

  return (
    <div className="relative h-full">
      {hasMapboxToken ? (
        <>
          <MapCanvas onMapLoad={handleMapLoad} className="h-full" />
          <MapControls map={mapInstance} />
          <RouteLayer map={mapInstance} route={activeRoute} />
          <TrafficLayer map={mapInstance} incidents={traffic?.incidents} />
          <CommunityPins map={mapInstance} pins={communityPins} />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-900 p-6 text-center">
          <span className="text-5xl">🗺️</span>
          <h2 className="text-xl font-semibold text-blue-400">Карта</h2>
          <p className="max-w-sm text-sm text-gray-400">
            Добавете <code className="text-blue-300">NEXT_PUBLIC_MAPBOX_TOKEN</code> за
            интерактивна карта. До тогава използвайте маршрута и границите.
          </p>
          <Link
            href="/route"
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Планирай маршрут
          </Link>
        </div>
      )}

      {mapInstance && (
        <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
          <div className="pointer-events-auto mx-auto max-w-lg rounded-lg border border-gray-700 bg-gray-900/90 p-3 backdrop-blur">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">
                  {activeRoute
                    ? `${activeRoute.origin.label} → ${activeRoute.destination.label}`
                    : "Няма активен маршрут"}
                </p>
                {activeRoute && (
                  <p className="text-xs text-gray-400">
                    {activeRoute.distance_km} км · ~{activeRoute.duration_min} мин
                  </p>
                )}
              </div>
              <Link
                href="/route"
                className="shrink-0 rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700"
              >
                {activeRoute ? "Промени" : "Маршрут"}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-24 left-0 right-0 px-4">
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto">
          {topBorders.map((border) => (
            <Link
              key={border.crossing_id}
              href="/borders"
              className="shrink-0 rounded-lg border border-gray-700 bg-gray-900/90 px-3 py-2 backdrop-blur"
            >
              <p className="text-xs text-gray-400">{border.name_bg}</p>
              <BorderWaitBadge waitMinutes={border.wait_time_cars} label="коли" />
            </Link>
          ))}
          {incidentCount > 0 && (
            <div className="shrink-0 rounded-lg border border-orange-700/50 bg-orange-900/40 px-3 py-2">
              <p className="text-xs text-orange-300">⚠️ {incidentCount} инцидента</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
