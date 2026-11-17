"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { Map } from "maplibre-gl";
import { useState } from "react";
import { MapCanvas } from "@/components/map/MapCanvas";
import { MapControls } from "@/components/map/MapControls";
import { RouteLayer } from "@/components/map/RouteLayer";
import { TrafficLayer } from "@/components/map/TrafficLayer";
import { TrafficFlowLayer } from "@/components/map/TrafficFlowLayer";
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
import { TripDashboard } from "@/components/trip/TripDashboard";
import { useTripSessionStore } from "@/lib/stores/trip-session.store";
import { TripProximity } from "@/components/location/TripProximity";
import { BorderTimeWatcher } from "@/components/borders/BorderTimeWatcher";
import { useRouteStore } from "@/lib/stores/route.store";
import { useThemeStore } from "@/lib/stores/theme.store";
import { useMapStyleStore } from "@/lib/stores/map-style.store";
import { useCommunityStore } from "@/lib/stores/community.store";
import { useMapStore } from "@/lib/stores/map.store";
import { useTraffic } from "@/lib/hooks/useTraffic";
import { useInitialLocation } from "@/lib/hooks/useInitialLocation";
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
import { snapOutward } from "@/lib/traffic/tiles";

/** Below this zoom the view is too wide for incident markers to mean anything. */
const TRAFFIC_MIN_ZOOM = 8;

export function MapExperience() {
  const pathname = usePathname();
  const scheme = useThemeStore((s) => s.scheme);
  const styleChoice = useMapStyleStore((s) => s.choice);
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
  const layersPanelOpen = useMapStore((s) => s.layersPanelOpen);
  const tripActive = useTripSessionStore((s) => s.active);
  const showTripDashboard = onHome && tripActive && tripPlan != null && !planOpen;

  const viewBounds = useMapStore((s) => s.view.bounds);
  const viewZoom = useMapStore((s) => s.view.zoom);
  const trafficOn = useMapStore((s) => s.layers.traffic);
  // The visible area, widened to whole degrees so a small pan does not refetch.
  const trafficBbox = useMemo(
    () =>
      onHome && trafficOn && viewBounds && viewZoom >= TRAFFIC_MIN_ZOOM
        ? snapOutward(viewBounds)
        : null,
    [onHome, trafficOn, viewBounds, viewZoom]
  );
  const { data: traffic } = useTraffic(trafficBbox, viewZoom);
  const { data: communityData } = useCommunityPins({
    bbox: DEFAULT_COMMUNITY_BBOX,
    enabled: onHome,
  });

  // Start at the driver's own position, unless a planned route is already shown.
  useInitialLocation(mapInstance, onHome && !activeRoute);

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

  // While the driving view is up, keep the driver in the visible part of the map.
  const userLocation = useMapStore((s) => s.userLocation);
  useEffect(() => {
    if (!mapInstance || !showTripDashboard || !userLocation) return;
    mapInstance.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: Math.max(mapInstance.getZoom(), 9),
      padding: { top: 90, bottom: 340, left: 0, right: 0 },
      duration: 800,
    });
  }, [mapInstance, showTripDashboard, userLocation]);

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
        key={`${scheme}-${styleChoice}`}
        onMapLoad={handleMapLoad}
        onMapUnload={handleMapUnload}
        onMapClick={handleMapClick}
        onMapLongPress={handleMapLongPress}
        dropMode={isDropMode && !dropCoords}
        className="h-[100dvh]"
      />
      <MapControls map={mapInstance} />
      <MapOverlayColumn>
        {showTripDashboard ? null : onHome && activeRoute ? (
          <RouteBottomSheet
            route={activeRoute}
            className={layersPanelOpen ? "max-md:invisible max-md:pointer-events-none" : ""}
          />
        ) : onHome ? (
          <HomeMapChips
            className={layersPanelOpen ? "max-md:invisible max-md:pointer-events-none" : ""}
          />
        ) : null}
        <div
          data-overlay-slot="legend-row"
          className={`pointer-events-none flex w-full max-w-[calc(100vw-5rem)] flex-nowrap items-center gap-2 ${
            layersPanelOpen ? "max-md:invisible max-md:pointer-events-none" : ""
          }`}
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
          <TrafficFlowLayer map={mapInstance} />
          <TrafficLayer map={mapInstance} incidents={traffic?.incidents} />
          <CommunityPins
            map={mapInstance}
            pins={communityData?.pins ?? localPins}
          />
          <MapPoiLayers map={mapInstance} />
        </>
      )}
      {showTripDashboard && tripPlan ? <TripDashboard plan={tripPlan} /> : null}
      <PlanMarkers map={mapInstance} />
      <HotspotLayer map={mapInstance} />
      <TripProximity />
      <BorderTimeWatcher />
      <UserLocationMarker map={mapInstance} />
    </div>
  );
}