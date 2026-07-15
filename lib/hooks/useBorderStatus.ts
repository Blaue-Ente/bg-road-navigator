import { useQuery } from "@tanstack/react-query";
import type { BorderStatus } from "@/types/border.types";
import type { EuropeanBorderRegion } from "@/lib/constants/european-borders";

export interface UseBorderStatusOptions {
  crossingId?: string;
  region?: EuropeanBorderRegion;
  corridorId?: string;
  borderIds?: string[];
  enabled?: boolean;
}

function buildBorderUrl(options: UseBorderStatusOptions): string {
  const params = new URLSearchParams();
  if (options.crossingId) params.set("crossing_id", options.crossingId);
  if (options.region) params.set("region", options.region);
  if (options.corridorId) params.set("corridor_id", options.corridorId);
  if (options.borderIds?.length) params.set("border_ids", options.borderIds.join(","));
  const query = params.toString();
  return query ? `/api/borders?${query}` : "/api/borders";
}

export function useBorderStatus(options: UseBorderStatusOptions = {}) {
  const { crossingId, region, corridorId, borderIds, enabled = true } = options;

  return useQuery({
    queryKey: ["border-status", crossingId, region, corridorId, borderIds],
    queryFn: async (): Promise<BorderStatus[]> => {
      const response = await fetch(buildBorderUrl(options));

      if (!response.ok) {
        throw new Error(`Border API returned ${response.status}`);
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
    enabled,
  });
}
