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
import { SearchIcon } from "@/components/icons/NavIcons";

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
  const communityPins = useCommunityStore((s) => s.pins);
  const { data: borders } = useBorderStatus({ region: "bulgaria" });
  const { data: traffic } = useTraffic(BULGARIA_BBOX, 7);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

  const handleMapLoad = useCallback((map: Map) => {
    setMapInstance(map);
  }, []);

  const topBorders = borders?.slice(0, 4) ?? [];
  const incidentCount = traffic?.incidents?.length ?? 0;

  return (
    <div className="relative h-full">
      <MapCanvas onMapLoad={handleMapLoad} className="h-full" />
      <MapControls map={mapInstance} />
      <RouteLayer map={mapInstance} route={activeRoute} />
      <TrafficLayer map={mapInstance} incidents={traffic?.incidents} />
      <CommunityPins map={mapInstance} pins={communityPins} />

      {/* Waze-style search bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <Link
          href="/route"
          className="pointer-events-auto mx-auto flex max-w-lg items-center gap-3 rounded-full waze-panel px-4 py-3.5 transition hover:scale-[1.01] active:scale-[0.99]"
        >
          <SearchIcon className="shrink-0 text-[var(--waze-accent)]" />
          <div className="min-w-0 flex-1">
            {activeRoute ? (
              <>
                <p className="truncate text-sm font-semibold text-[var(--waze-text)]">
                  {activeRoute.origin.label} → {activeRoute.destination.label}
                </p>
                <p className="truncate text-xs text-[var(--waze-text-muted)]">
                  {activeRoute.distance_km} км · {formatDuration(activeRoute.duration_min)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--waze-text)]">
                  Къде отивате?
                </p>
                <p className="text-xs text-[var(--waze-text-muted)]">
                  Планирайте маршрут в Европа
                </p>
              </>
            )}
          </div>
          <span className="waze-btn-primary shrink-0 px-4 py-2 text-xs">
            {activeRoute ? "Промени" : "Тръгни"}
          </span>
        </Link>
      </div>

      {/* Bottom info strip — borders & traffic */}
      <div
        className="absolute inset-x-0 z-10 px-3"
        style={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto pb-1 scrollbar-none">
          {topBorders.map((border) => (
            <Link
              key={border.crossing_id}
              href="/borders"
              className="waze-panel shrink-0 px-3 py-2.5 transition hover:scale-[1.02]"
            >
              <p className="mb-1 max-w-[120px] truncate text-[11px] font-medium text-[var(--waze-text-secondary)]">
                {border.name_bg}
              </p>
              <BorderWaitBadge waitMinutes={border.wait_time_cars} compact />
            </Link>
          ))}
          {incidentCount > 0 && (
            <div className="waze-panel shrink-0 border-orange-500/30 bg-orange-500/10 px-3 py-2.5">
              <p className="text-xs font-medium text-orange-300">
                ⚠ {incidentCount} инцидента
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
