"use client";

import { useQuery } from "@tanstack/react-query";
import type { FuelApiResponse } from "@/types/fuel.types";
import type { BoundingBox } from "@/types/map.types";

export function useFuelStations(bbox?: BoundingBox) {
  return useQuery({
    queryKey: ["fuel-stations", bbox],
    queryFn: async (): Promise<FuelApiResponse> => {
      const params = bbox
        ? `?w=${bbox.w}&s=${bbox.s}&e=${bbox.e}&n=${bbox.n}`
        : "";
      const response = await fetch(`/api/fuel${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch fuel data");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 60,
  });
}
