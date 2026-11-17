"use client";

import { useCallback } from "react";
import { catalog } from "@/lib/i18n/locale";
import { useMapStore, type LocateStatus } from "@/lib/stores/map.store";

function statusFromError(error: GeolocationPositionError): LocateStatus {
  if (error.code === error.PERMISSION_DENIED) return "denied";
  if (error.code === error.TIMEOUT) return "timeout";
  return "unavailable";
}

export type LocateMessageCode = keyof ReturnType<
  typeof import("@/lib/i18n/locale").catalog
>["location"]["geo"];

export function locateStatusMessageCode(
  status: LocateStatus
): LocateMessageCode | null {
  switch (status) {
    case "denied":
      return "denied";
    case "unavailable":
      return "unavailable";
    case "timeout":
      return "timeout";
    case "locating":
      return "locating";
    default:
      return null;
  }
}

/** Bulgarian fallback for tests or callers without locale context. */
export function locateStatusMessage(status: LocateStatus): string | null {
  const code = locateStatusMessageCode(status);
  if (!code) return null;
  return catalog("bg").location.geo[code];
}

export function useGeolocation() {
  const setLocateStatus = useMapStore((s) => s.setLocateStatus);
  const setUserLocation = useMapStore((s) => s.setUserLocation);

  const getCurrentLocation =
    useCallback((options?: {
      /** A quick, coarse fix for the first visit; the locate button keeps GPS accuracy. */
      coarse?: boolean;
    }): Promise<GeolocationPosition | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          setLocateStatus("unavailable");
          resolve(null);
          return;
        }

        setLocateStatus("locating");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lng: position.coords.longitude,
              lat: position.coords.latitude,
              accuracy: position.coords.accuracy,
            });
            setLocateStatus("success");
            resolve(position);
          },
          (error) => {
            setLocateStatus(statusFromError(error));
            resolve(null);
          },
          options?.coarse
            ? { enableHighAccuracy: false, timeout: 8_000, maximumAge: 120_000 }
            : { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 }
        );
      });
    }, [setLocateStatus, setUserLocation]);

  return { getCurrentLocation };
}