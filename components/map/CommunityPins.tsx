"use client";

import type { Map } from "maplibre-gl";
import type { CommunityPin } from "@/types/community.types";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { COMMUNITY_PIN_ICONS, communityPinColor, communityPinGlyph, communityPinLabel, formatPinAge } from "@/lib/constants/community-pins";
import { ClusteredPoiLayer } from "@/components/map/ClusteredPoiLayer";
import { useMapStore } from "@/lib/stores/map.store";

export interface CommunityPinsProps {
  map: Map | null;
  pins?: CommunityPin[];
}

export function CommunityPins({ map, pins = [] }: CommunityPinsProps) {
  const locale = useLocale();
  const enabled = useMapStore((s) => s.layers.community);
  const chosen = useMapStore((s) => s.communityCategories);
  const shown = chosen.length === 0 ? pins : pins.filter((pin) => chosen.includes(pin.category));
  const points = shown.map((pin) => ({
    id: pin.id,
    lng: pin.coords.lng,
    lat: pin.coords.lat,
    title: pin.title,
    subtitle: `${communityPinLabel(pin.category, locale)} · ${formatPinAge(pin.created_at, locale)}`,
    color: communityPinColor(pin.category),
    glyph: communityPinGlyph(pin.category),
    icon: COMMUNITY_PIN_ICONS[pin.category] ?? ("info" as const),
  }));

  return (
    <ClusteredPoiLayer
      map={map}
      sourceId="community-pins"
      points={points}
      color="#1e40af"
      enabled={enabled}
    />
  );
}
