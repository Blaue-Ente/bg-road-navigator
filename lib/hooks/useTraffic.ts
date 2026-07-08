import { useQuery } from "@tanstack/react-query";
import type { TrafficFlowResponse } from "@/types/traffic.types";

export function useTraffic(bbox: { w: number; s: number; e: number; n: number }, zoom: number) {
  return useQuery({
    queryKey: ["traffic", bbox, zoom],
    queryFn: async (): Promise<TrafficFlowResponse> => {
      // TODO: Call /api/traffic/route.ts
      // For now return mock data
      return {
        flow: [],
        incidents: [
          {
            id: "incident-1",
            type: "accident",
            title: "Колезно произшествие",
            description: "Сблъсък между два автомобилa",
            coords: { lng: 23.0, lat: 42.7 },
            severity: "major",
            delay_min: 15,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      };
    },
    staleTime: 1000 * 90, // 90 seconds
  });
}