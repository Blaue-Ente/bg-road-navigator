"use client";

import { useCallback, useState } from "react";
import { findNearestCity } from "@/lib/constants/european-cities";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { useCalculateRoute } from "@/lib/hooks/useCalculateRoute";
import { useHomeStore } from "@/lib/stores/home.store";
import {
  homeCityToRoutePoint,
  isAlreadyHome,
} from "@/lib/utils/home-briefing";
import type { Route, RoutePoint } from "@/types/route.types";

export type GoHomeError =
  | "location"
  | "already-home"
  | "same-point"
  | "route";

export function useGoHome() {
  const { getCurrentLocation } = useGeolocation();
  const { calculate, calculating } = useCalculateRoute();
  const homeCityId = useHomeStore((s) => s.homeCityId);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<GoHomeError | null>(null);

  const resolveGps = useCallback(async (): Promise<RoutePoint | null> => {
    const position = await getCurrentLocation();
    if (!position) return null;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    try {
      const response = await fetch(
        `/api/places/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`
      );
      if (response.ok) {
        const data = (await response.json()) as { place: RoutePoint };
        if (data.place) return data.place;
      }
    } catch {
      // Fall through to curated nearest city.
    }

    const nearby = findNearestCity({ lat, lng }, 120);
    return {
      id: nearby?.id ?? `gps:${lat.toFixed(4)},${lng.toFixed(4)}`,
      label: nearby?.label ?? "Моята локация",
      subtitle: nearby?.country ?? "Текуща позиция",
      coords: { lng, lat },
      source: "user",
    };
  }, [getCurrentLocation]);

  const goHome = useCallback(async (): Promise<{
    route: Route | null;
    origin: RoutePoint | null;
    error: GoHomeError | null;
  }> => {
    setError(null);
    setLocating(true);
    const origin = await resolveGps();
    setLocating(false);

    if (!origin) {
      setError("location");
      return { route: null, origin: null, error: "location" };
    }

    const destination = homeCityToRoutePoint(homeCityId);
    if (isAlreadyHome(origin.coords, homeCityId)) {
      setError("already-home");
      return { route: null, origin, error: "already-home" };
    }
    if (origin.id === destination.id) {
      setError("same-point");
      return { route: null, origin, error: "same-point" };
    }

    const route = await calculate({ points: [origin, destination] });
    if (!route) {
      setError("route");
      return { route: null, origin, error: "route" };
    }

    return { route, origin, error: null };
  }, [calculate, homeCityId, resolveGps]);

  return {
    goHome,
    resolveGps,
    locating,
    calculating,
    busy: locating || calculating,
    error,
    setError,
    homeCityId,
  };
}

export function goHomeErrorMessage(error: GoHomeError | null): string | null {
  if (error === "location") {
    return "Не успяхме да вземем локацията. Разрешете достъп или изберете начална точка ръчно.";
  }
  if (error === "already-home" || error === "same-point") {
    return "Вече сте близо до вкъщи. Ако пътувате от друго място, изберете начална точка.";
  }
  if (error === "route") {
    return "Маршрутът към вкъщи не можа да се изчисли. Опитайте отново.";
  }
  return null;
}
