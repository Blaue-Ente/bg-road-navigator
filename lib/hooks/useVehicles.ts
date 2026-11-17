"use client";

import { useQuery } from "@tanstack/react-query";
import type { UserVehicle } from "@/lib/vehicles/types";

export interface VehiclesPayload {
  vehicles: UserVehicle[];
  configured: boolean;
}

export const VEHICLES_KEY = ["vehicles"] as const;

export function useVehicles(enabled = true) {
  const query = useQuery({
    queryKey: VEHICLES_KEY,
    enabled,
    staleTime: 60_000,
    queryFn: async (): Promise<VehiclesPayload> => {
      const response = await fetch("/api/vehicles");
      if (response.status === 401) return { vehicles: [], configured: true };
      if (!response.ok) throw new Error("vehicles");
      const payload = (await response.json()) as Partial<VehiclesPayload>;
      return {
        vehicles: payload.vehicles ?? [],
        configured: payload.configured !== false,
      };
    },
  });
  const vehicles = query.data?.vehicles ?? [];
  return {
    ...query,
    vehicles,
    configured: query.data?.configured !== false,
    activeVehicle: vehicles.find((vehicle) => vehicle.is_active) ?? null,
  };
}
