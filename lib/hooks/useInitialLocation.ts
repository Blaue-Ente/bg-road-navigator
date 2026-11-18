"use client";

import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import { isInEurope } from "@/lib/geo/bounds";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useMapStore } from "@/lib/stores/map.store";

/** Asked once per page load, so moving between screens never prompts twice. */
let askedThisLoad = false;

/** Zoom that shows the surrounding region without hiding the whole route network. */
const START_ZOOM = 9;

export function shouldFlyToPosition(position: {
  lng: number;
  lat: number;
}): boolean {
  return isInEurope(position.lng, position.lat);
}

/**
 * Asks for the position once, as soon as the home map is ready, and moves the
 * map there. A refusal, a timeout or a position outside Europe leaves the
 * Bulgaria view as it was. One-shot only: no watch, nothing is stored.
 */
export function useInitialLocation(map: Map | null, enabled: boolean) {
  const { getCurrentLocation } = useGeolocation();

  useEffect(() => {
    if (!map || !enabled || askedThisLoad) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    askedThisLoad = true;
    let cancelled = false;

    void (async () => {
      try {
        // Where the browser can say so, do not prompt again after a refusal.
        const status = await navigator.permissions?.query({
          name: "geolocation",
        });
        if (status?.state === "denied") {
          useMapStore.getState().setLocateStatus("denied");
          return;
        }
      } catch {
        // Permissions API is missing on some browsers; asking is still fine.
      }
      const position = await getCurrentLocation({ coarse: true });
      if (cancelled || !position) return;
      const point = {
        lng: position.coords.longitude,
        lat: position.coords.latitude,
      };
      if (!shouldFlyToPosition(point)) return;
      // A place the driver asked to see (a signal opened from the list) wins.
      if (useMapStore.getState().flyRequest) return;
      map.flyTo({ center: [point.lng, point.lat], zoom: START_ZOOM });
    })();

    return () => {
      cancelled = true;
    };
  }, [map, enabled, getCurrentLocation]);
}
