"use client";

import { useQuery } from "@tanstack/react-query";
import { FuelStation } from "@/types/fuel.types";

export function useFuelStations(bbox?: { w: number; s: number; e: number; n: number }, zoom: number) {
  return useQuery({
    queryKey: ["fuel-stations", bbox, zoom],
    queryFn: async (): Promise<FuelStation[]> => {
      // Simple mock for now - in real app this would call /api/fuel-prices or Mapbox route service
      return [
        {
          id: "fuel-1",
          name: "Total",
          operator: "Total EOOD",
          coords: { lng: 23.3219, lat: 42.6977 },
          brand: "Total",
          prices: {
            diesel: 2.85,
            petrol95: 2.68,
            petrol98: 2.95,
            lpg: 1.45,
            adblue: 2.10
          },
          open: true,
          distance_km: 5.2,
          payment_methods: ["Налично", "Карточка", "Apple Pay"],
          location: "Sofia Center Mall"
        },
        {
          id: "fuel-2",
          name: "Lukoil",
          operator: "Lukoil AD",
          coords: { lng: 26.4501, lat: 42.6667 },
          brand: "Lukoil",
          prices: {
            diesel: 2.80,
            petrol95: 2.65,
            petrol98: 2.90,
            lpg: 1.42,
            adblue: 2.05
          },
          open: true,
          distance_km: 12.8,
          payment_methods: ["Карточка", "Apple Pay"]
        }
      ];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}