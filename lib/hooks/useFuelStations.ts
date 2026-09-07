"use client";

import { useQuery } from "@tanstack/react-query";
import type { FuelApiResponse } from "@/types/fuel.types";
import type { BoundingBox } from "@/types/map.types";

export function useFuelStations(
  bbox?: BoundingBox,
  options?: { routePolyline?: string; enabled?: boolean }
) {
  const routePolyline = options?.routePolyline;

  return useQuery({
    queryKey: ["fuel-stations", bbox, routePolyline ?? null],
    queryFn: async (): Promise<FuelApiResponse> => {
      const params = new URLSearchParams();
      if (routePolyline) {
        params.set("route", routePolyline);
      } else if (bbox) {
        params.set("w", String(bbox.w));
        params.set("s", String(bbox.s));
        params.set("e", String(bbox.e));
        params.set("n", String(bbox.n));
      }
      const query = params.toString();
      const response = await fetch(query ? `/api/fuel?${query}` : "/api/fuel");
      if (!response.ok) {
        throw new Error("Failed to fetch fuel data");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60,
    enabled: options?.enabled ?? true,
  });
}
