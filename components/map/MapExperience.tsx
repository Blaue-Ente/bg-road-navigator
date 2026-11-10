"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Map } from "maplibre-gl";
import { useState } from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { MapControls } from "@/components/map/MapControls";
import { RouteLayer } from "@/components/map/RouteLayer";
import { TrafficLayer } from "@/components/map/TrafficLayer";
import { CommunityPins } from "@/components/map/CommunityPins";
import { MapPoiLayers } from "@/components/map/MapPoiLayers";
import { UserLocationMarker } from "@/components/map/UserLocationMarker";
import { useRouteStore } from "@/lib/stores/route.store";
import { useThemeStore } from "@/lib/stores/theme.store";
import { useCommunityStore } from "@/lib/stores/community.store";
import { useTraffic } from "@/lib/hooks/useTraffic";
import {
  DEFAULT_COMMUNITY_BBOX,
  useCommunityPins,
} from "@/lib/hooks/useCommunityPins";
import { fitMapToRoute } from "@/lib/map/apply-waze-style";

const BULGARIA_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export function MapExperience() {
  const pathname = usePathname();
  const scheme = useThemeStore((s) => s.scheme);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const alternativeRoutes = useRouteStore((s) => s.alternativeRoutes);
  const localPins = useCommunityStore((s) => s.pins);
  const isDropMode = useCommunityStore((s) => s.isDropMode);
  const dropCoords = useCommunityStore((s) => s.dropCoords);
  const beginDrop = useCommunityStore((s) => s.beginDrop);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  const onHome = pathname === "/";

  const { data: traffic } = useTraffic(BULGARIA_BBOX, 7);
  const { data: communityData } = useCommunityPins({
    bbox: DEFAULT_COMMUNITY_BBOX,
    enabled: onHome,
  });

  const handleMapLoad = useCallback((map: Map) => {
    setMapInstance(map);
  }, []);

  const handleMapUnload = useCallback(() => {
    setMapInstance(null);
  }, []);

  const handleMapClick = useCallback(
    (coords: { lng: number; lat: number }) => {
      if (!isDropMode || dropCoords) return;
      beginDrop(coords);
    },
    [isDropMode, dropCoords, beginDrop]
  );

  const handleMapLongPress = useCallback(
    (coords: { lng: number; lat: number }) => {
      beginDrop(coords);
    },
    [beginDrop]
  );

  useEffect(() => {
    if (!mapInstance || !activeRoute?.geometry?.coordinates?.length) return;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    fitMapToRoute(
      mapInstance,
      activeRoute.geometry.coordinates as [number, number][],
      desktop
        ? { top: 88, bottom: 48, left: onHome ? 40 : 420, right: 56 }
        : { top: 96, bottom: 210, left: 28, right: 28 }
    );
  }, [mapInstance, activeRoute, onHome]);

  return (
    <div className="relative h-[100dvh] w-full">
      <MapCanvas
        key={scheme}
        onMapLoad={handleMapLoad}
        onMapUnload={handleMapUnload}
        onMapClick={handleMapClick}
        onMapLongPress={handleMapLongPress}
        dropMode={isDropMode && !dropCoords}
        className="h-[100dvh]"
      />
      <MapControls map={mapInstance} />
      <RouteLayer
        map={mapInstance}
        route={activeRoute}
        alternatives={alternativeRoutes}
      />
      {onHome && (
        <>
          <TrafficLayer map={mapInstance} incidents={traffic?.incidents} />
          <CommunityPins
            map={mapInstance}
            pins={communityData?.pins ?? localPins}
          />
          <MapPoiLayers map={mapInstance} />
        </>
      )}
      <UserLocationMarker map={mapInstance} />
    </div>
  );
}
