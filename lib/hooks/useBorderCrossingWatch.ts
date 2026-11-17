import { useEffect } from "react";
import { getAllEuropeanCrossings } from "@/lib/constants/european-borders";
import {
  nearestCrossing,
  stepWatch,
  type CrossingPoint,
  type WatchState,
} from "@/lib/borders/crossing-watch";
import { useBorderTimeStore } from "@/lib/stores/border-time.store";

/** Start loading the country outlines this far from a crossing. */
const PRELOAD_KM = 15;

let crossingPoints: CrossingPoint[] | null = null;
function crossings(): CrossingPoint[] {
  crossingPoints ??= getAllEuropeanCrossings().map((crossing) => ({
    id: crossing.id,
    lng: crossing.coords.lng,
    lat: crossing.coords.lat,
  }));
  return crossingPoints;
}

/**
 * Watches the driver's position and, after a border has been crossed, offers a
 * measured wait to confirm. Works only while the page is open and receiving
 * positions. The country outlines (about 130 KB) load only near a crossing.
 */
export function useBorderCrossingWatch(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;

    let state: WatchState = { phase: "idle" };
    let countryAt: ((lng: number, lat: number) => string | null) | null = null;
    let loading = false;

    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const fix = {
          lng: position.coords.longitude,
          lat: position.coords.latitude,
          t: position.timestamp || Date.now(),
          speedKmh:
            typeof position.coords.speed === "number" ? position.coords.speed * 3.6 : null,
        };
        const near = nearestCrossing(fix, crossings());
        if (!countryAt && !loading && near && near.km <= PRELOAD_KM) {
          loading = true;
          void import("@/lib/geo/countries-along-route").then((module) => {
            countryAt = module.countryCodeAtPoint;
          });
        }
        const step = stepWatch(state, fix, crossings(), countryAt ?? (() => null));
        state = step.state;
        if (step.done) useBorderTimeStore.getState().offer(step.done);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [enabled]);
}
