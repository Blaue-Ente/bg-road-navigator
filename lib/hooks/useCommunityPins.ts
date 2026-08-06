import { useQuery } from "@tanstack/react-query";
import type { CommunityPin } from "@/types/community.types";

export interface CommunityPinsBbox {
  west: number;
  south: number;
  east: number;
  north: number;
}

async function fetchCommunityPins(bbox?: CommunityPinsBbox): Promise<{
  pins: CommunityPin[];
  configured: boolean;
}> {
  const params = new URLSearchParams();
  if (bbox) {
    params.set("west", String(bbox.west));
    params.set("south", String(bbox.south));
    params.set("east", String(bbox.east));
    params.set("north", String(bbox.north));
  }
  const query = params.toString();
  const response = await fetch(
    query ? `/api/community/pins?${query}` : "/api/community/pins"
  );
  if (!response.ok) throw new Error(`Community API ${response.status}`);
  return response.json();
}

/** Default wide Balkans/Europe view used on the home map. */
export const DEFAULT_COMMUNITY_BBOX: CommunityPinsBbox = {
  west: 12,
  south: 40,
  east: 30,
  north: 50,
};

export function useCommunityPins(options?: {
  bbox?: CommunityPinsBbox;
  enabled?: boolean;
}) {
  const bbox = options?.bbox;
  return useQuery({
    queryKey: ["community-pins", bbox],
    queryFn: () => fetchCommunityPins(bbox),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 2,
    enabled: options?.enabled ?? true,
  });
}
