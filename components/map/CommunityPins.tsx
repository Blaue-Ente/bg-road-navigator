"use client";

import type { Map } from "maplibre-gl";
import type { CommunityPin } from "@/types/community.types";
import { communityPinColor } from "@/lib/constants/community-pins";
import { ClusteredPoiLayer } from "@/components/map/ClusteredPoiLayer";
import { useMapStore } from "@/lib/stores/map.store";

export interface CommunityPinsProps {
  map: Map | null;
  pins?: CommunityPin[];
}

export function CommunityPins({ map, pins = [] }: CommunityPinsProps) {
  const enabled = useMapStore((s) => s.layers.community);
  const points = pins.map((pin) => ({
    id: pin.id,
    lng: pin.coords.lng,
    lat: pin.coords.lat,
    title: pin.title,
    subtitle: pin.category,
    color: communityPinColor(pin.category),
  }));

  return (
    <ClusteredPoiLayer
      map={map}
      sourceId="community-pins"
      points={points}
      color="#33ccff"
      enabled={enabled}
    />
  );
}
