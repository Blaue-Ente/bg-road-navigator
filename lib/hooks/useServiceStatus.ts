"use client";

import { useQuery } from "@tanstack/react-query";
import type { ConfigStatusResponse } from "@/lib/config/service-status";

async function fetchStatus(): Promise<ConfigStatusResponse> {
  const response = await fetch("/api/config/status");
  if (!response.ok) throw new Error("status failed");
  return response.json();
}

export function useServiceStatus() {
  return useQuery({
    queryKey: ["config-status"],
    queryFn: fetchStatus,
    staleTime: 30_000,
  });
}
