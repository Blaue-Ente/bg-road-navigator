"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { SpeedCameraResult } from "@/lib/api-clients/speed-cameras";

export interface CameraBbox {
  w: number;
  s: number;
  e: number;
  n: number;
}

export function useSpeedCameras(bbox: CameraBbox | null, enabled: boolean) {
  return useQuery({
    queryKey: ["speed-cameras", bbox],
    enabled: enabled && bbox != null,
    staleTime: 1000 * 60 * 60,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<SpeedCameraResult> => {
      const params = new URLSearchParams({
        w: String(bbox!.w),
        s: String(bbox!.s),
        e: String(bbox!.e),
        n: String(bbox!.n),
      });
      const response = await fetch(`/api/speed-cameras?${params}`);
      if (!response.ok) return { cameras: [], ok: false };
      return (await response.json()) as SpeedCameraResult;
    },
  });
}
