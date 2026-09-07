"use client";

import { useCallback } from "react";
import { useMapStore, type LocateStatus } from "@/lib/stores/map.store";

function statusFromError(error: GeolocationPositionError): LocateStatus {
  if (error.code === error.PERMISSION_DENIED) return "denied";
  if (error.code === error.TIMEOUT) return "timeout";
  return "unavailable";
}

export function locateStatusMessage(status: LocateStatus): string | null {
  switch (status) {
    case "denied":
      return "Достъпът до локацията е отказан. Разрешете GPS от настройките на браузъра.";
    case "unavailable":
      return "Локацията не е налична на това устройство.";
    case "timeout":
      return "Изчакването за GPS изтече. Опитайте отново.";
    case "locating":
      return "Търсене на позиция…";
    default:
      return null;
  }
}

export function useGeolocation() {
  const setLocateStatus = useMapStore((s) => s.setLocateStatus);
  const setUserLocation = useMapStore((s) => s.setUserLocation);

  const getCurrentLocation =
    useCallback((): Promise<GeolocationPosition | null> => {
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
          { enableHighAccuracy: true, timeout: 10_000, maximumAge: 15_000 }
        );
      });
    }, [setLocateStatus, setUserLocation]);

  return { getCurrentLocation };
}
