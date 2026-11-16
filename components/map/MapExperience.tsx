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
import { PlanMarkers } from "@/components/map/PlanMarkers";
import { HotspotLayer } from "@/components/map/HotspotLayer";
import { MapLegend } from "@/components/map/MapLegend";
import { MapOverlayColumn } from "@/components/map/MapOverlayColumn";
import { HomeMapChips } from "@/components/map/HomeMapChips";
import { HotspotAttributionButton } from "@/components/map/HotspotAttributionButton";
import { MapAttributionButton } from "@/components/map/MapAttributionButton";
import { RouteBottomSheet } from "@/components/map/RouteBottomSheet";
import { TripProximity } from "@/components/location/TripProximity";
import { useRouteStore } from "@/lib/stores/route.store";
import { useThemeStore } from "@/lib/stores/theme.store";
import { useCommunityStore } from "@/lib/stores/community.store";
import { useTraffic } from "@/lib/hooks/useTraffic";
import {
  DEFAULT_COMMUNITY_BBOX,
  useCommunityPins,
} from "@/lib/hooks/useCommunityPins";
import { applyPlanRouteOptions } from "@/components/plan/RouteChoiceCards";
import { fitMapToRoute } from "@/lib/map/apply-waze-style";
import {
  routeChoiceFromAlternative,
} from "@/lib/planner/route-options";
import { replanTrip } from "@/lib/planner/replan-trip";

const BULGARIA_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export function MapExperience() {
  const pathname = usePathname();
  const scheme = useThemeStore((s) => s.scheme);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const planOpen = useRouteStore((s) => s.planDetailOpen);
  const alternativeRoutes = useRouteStore((s) => s.alternativeRoutes);
  const tripPlan = useRouteStore((s) => s.tripPlan);
  const planningVia = useRouteStore((s) => s.planningVia);
  const setTripPlan = useRouteStore((s) => s.setTripPlan);
  const setActiveRoute = useRouteStore((s) => s.setActiveRoute);
  const setAlternativeRoutes = useRouteStore((s) => s.setAlternativeRoutes);
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

  const handlePickAlternative = useCallback(
    (index: number) => {
      const alt = tripPlan?.route_options?.alternative;
      if (!alt || !tripPlan || index !== 0) return;
      void (async () => {
        const next = await replanTrip({
          plan: tripPlan,
          via: planningVia,
          routeChoice: routeChoiceFromAlternative(alt),
        });
        if (!next) return;
        setTripPlan(next);
        if (activeRoute) {
          setActiveRoute({
            ...activeRoute,
            distance_km: next.route.distance_km,
            duration_min: next.route.duration_min,
            geometry: next.route.geometry,
            routing_source: next.route.routing_source,
          });
        }
        applyPlanRouteOptions(next, activeRoute, setAlternativeRoutes);
      })();
    },
    [
      tripPlan,
      planningVia,
      activeRoute,
      setTripPlan,
      setActiveRoute,
      setAlternativeRoutes,
    ]
  );

  useEffect(() => {
    if (!mapInstance || !activeRoute?.geometry?.coordinates?.length) return;
    const merged: [number, number][] = [
      ...(activeRoute.geometry.coordinates as [number, number][]),
    ];
    for (const alt of alternativeRoutes) {
      if (alt.geometry?.coordinates?.length) {
        merged.push(...(alt.geometry.coordinates as [number, number][]));
      }
    }
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const sheet = document.getElementById("plan-detail");
    const sheetPad = sheet?.offsetWidth ? sheet.offsetWidth + 24 : 404;
    fitMapToRoute(
      mapInstance,
      merged,
      desktop
        ? {
            top: 88,
            bottom: 48,
            left: onHome ? 40 : 420,
            right: planOpen ? sheetPad : 56,
          }
        : { top: 96, bottom: planOpen ? 96 : 210, left: 28, right: 28 }
    );
  }, [mapInstance, activeRoute, alternativeRoutes, onHome, planOpen]);

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
      <MapOverlayColumn>
        {onHome && activeRoute ? (
          <RouteBottomSheet route={activeRoute} />
        ) : onHome ? (
          <HomeMapChips />
        ) : null}
        <div
          data-overlay-slot="legend-row"
          className="pointer-events-none flex w-full max-w-[min(22rem,calc(100vw-1.5rem))] flex-wrap items-end gap-2"
        >
          <MapLegend />
          <HotspotAttributionButton map={mapInstance} />
          <MapAttributionButton />
        </div>
      </MapOverlayColumn>
      <RouteLayer
        map={mapInstance}
        route={activeRoute}
        alternatives={alternativeRoutes}
        onPickAlternative={tripPlan ? handlePickAlternative : undefined}
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
      <PlanMarkers map={mapInstance} />
      <HotspotLayer map={mapInstance} />
      <TripProximity />
      <UserLocationMarker map={mapInstance} />
    </div>
  );
}