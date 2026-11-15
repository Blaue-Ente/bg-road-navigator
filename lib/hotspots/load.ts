import file from "@/lib/hotspots/data/hotspots.json";
import type { Hotspot, HotspotFile } from "@/lib/hotspots/types";

const data = file as HotspotFile;

export function loadHotspotFile(): HotspotFile {
  return data;
}

export function loadHotspots(): Hotspot[] {
  return data.hotspots;
}

export function hotspotsInBbox(
  hotspots: Hotspot[],
  bbox: { west: number; south: number; east: number; north: number },
  limit = 1500
): { hotspots: Hotspot[]; truncated: boolean } {
  const matched: Hotspot[] = [];
  for (const hotspot of hotspots) {
    if (
      hotspot.lng < bbox.west ||
      hotspot.lng > bbox.east ||
      hotspot.lat < bbox.south ||
      hotspot.lat > bbox.north
    ) {
      continue;
    }
    matched.push(hotspot);
    if (matched.length > limit) break;
  }
  return {
    hotspots: matched.slice(0, limit),
    truncated: matched.length > limit,
  };
}
