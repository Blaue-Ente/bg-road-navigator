"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Map } from "maplibre-gl";
import { useRouteStore } from "@/lib/stores/route.store";
import { formatDuration } from "@/lib/utils/route-planner";
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
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

  const handleMapLoad = useCallback((map: Map) => {
    setMapInstance(map);
  }, []);

  const topBorders = borders?.slice(0, 3) ?? [];
  const incidentCount = traffic?.incidents?.length ?? 0;

  return (
    <div className="relative h-full">
      <MapCanvas onMapLoad={handleMapLoad} className="h-full" />
      <MapControls map={mapInstance} />
      <RouteLayer map={mapInstance} route={activeRoute} />
      <TrafficLayer map={mapInstance} incidents={traffic?.incidents} />
      <CommunityPins map={mapInstance} pins={communityPins} />

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
                    {activeRoute.distance_km} км · {formatDuration(activeRoute.duration_min)}
                    {activeRoute.routing_source === "osrm" ? " · OSRM" : ""}
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
