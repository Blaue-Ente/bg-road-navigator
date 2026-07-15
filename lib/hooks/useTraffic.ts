import { useQuery } from "@tanstack/react-query";
import type { TrafficFlowResponse } from "@/types/traffic.types";
import type { BoundingBox } from "@/types/map.types";

export function useTraffic(bbox: BoundingBox, zoom: number) {
  return useQuery({
    queryKey: ["traffic", bbox, zoom],
    queryFn: async (): Promise<TrafficFlowResponse> => {
      const bboxParam = `${bbox.w},${bbox.s},${bbox.e},${bbox.n}`;
      const response = await fetch(
        `/api/traffic?bbox=${bboxParam}&zoom=${zoom}`
      );

      if (!response.ok) {
        throw new Error("Traffic API failed");
      }

      const data = await response.json();

      return {
        flow: data.flow ?? [],
        incidents: (data.incidents ?? []).map(
          (incident: {
            id: string;
            type: string;
            title: string;
            description: string;
            coords: { lng: number; lat: number };
            severity: string;
            delayMin?: number;
            delay_min?: number;
            publishedAt?: string;
            published_at?: string;
            updatedAt?: string;
            updated_at?: string;
          }) => ({
            id: incident.id,
            type: incident.type,
            title: incident.title,
            description: incident.description,
            coords: incident.coords,
            severity: incident.severity,
            delay_min: incident.delay_min ?? incident.delayMin ?? 0,
            published_at:
              incident.published_at ?? incident.publishedAt ?? new Date().toISOString(),
            updated_at:
              incident.updated_at ?? incident.updatedAt ?? new Date().toISOString(),
          })
        ),
      };
    },
    staleTime: 1000 * 90,
  });
}
