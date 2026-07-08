import { useQuery } from "@tanstack/react-query";
import type { BorderStatus } from "@/types/border.types";

export function useBorderStatus(crossingId?: string) {
  return useQuery({
    queryKey: ["border-status", crossingId],
    queryFn: async (): Promise<BorderStatus[]> => {
      const url = crossingId 
        ? `/api/borders?crossing_id=${crossingId}`
        : "/api/borders";
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Border API returned ${response.status}`);
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 min
  });
}
