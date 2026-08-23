"use client";

import { useCallback, useState } from "react";
import { requestCalculatedRoute } from "@/lib/api-clients/route";
import { useRouteStore } from "@/lib/stores/route.store";
import type { Route, RoutePoint } from "@/types/route.types";

function applyRouteToStore(route: Route) {
  const { setActiveRoute, setAlternativeRoutes } = useRouteStore.getState();
  setActiveRoute(route);
  setAlternativeRoutes(
    (route.alternatives ?? []).map((alt) => ({
      ...route,
      id: alt.id,
      distance_km: alt.distance_km,
      duration_min: alt.duration_min,
      geometry: alt.geometry,
      alternatives: [],
    }))
  );
}

export function useCalculateRoute() {
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(
    async (params: {
      corridorId?: string;
      points?: RoutePoint[];
    }): Promise<Route | null> => {
      setCalculating(true);
      setError(null);

      const route = await requestCalculatedRoute(params);
      if (!route) {
        setError("Неуспешно изчисление. Опитайте отново.");
        setCalculating(false);
        return null;
      }

      applyRouteToStore(route);
      setCalculating(false);
      return route;
    },
    []
  );

  return { calculate, calculating, error, setError };
}
