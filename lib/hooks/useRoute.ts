import { useQuery } from "@tanstack/react-query";
import type { Route } from "@/types/route.types";

export function useRoute() {
  return useQuery({
    queryKey: ["route"],
    queryFn: async (): Promise<Route> => {
      // TODO: Implement API call to route calculation service
      // For now, return a mock route
      return {
        id: "mock-route-1",
        origin: {
          id: "origin-1",
          label: "София",
          coords: { lng: 23.3219, lat: 42.6977 }
        },
        destination: {
          id: "dest-1",
          label: "Калотина",
          coords: { lng: 22.8969, lat: 42.9833 }
        },
        waypoints: [],
        distance_km: 45.2,
        duration_min: 38,
        geometry: {
          type: "LineString",
          coordinates: [
            [23.3219, 42.6977],
            [23.0667, 41.4667],
            [22.8969, 42.9833]
          ]
        },
        alternatives: []
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}