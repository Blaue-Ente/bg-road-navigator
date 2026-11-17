"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { TrafficIncident } from "@/types/traffic.types";
import { escapeHtml } from "@/lib/geo/escape-html";
import { formatTemplate } from "@/lib/i18n/format-template";
import { useMapStore } from "@/lib/stores/map.store";
import { poiIconSvg } from "@/lib/map/poi-icons";
import { TRAFFIC_KIND_STYLE, trafficPinSize } from "@/lib/map/traffic-kinds";

export interface TrafficLayerProps {
  map: Map | null;
  incidents?: TrafficIncident[];
}

export function TrafficLayer({ map, incidents = [] }: TrafficLayerProps) {
  const m = useMessages();
  const enabled = useMapStore((s) => s.layers.traffic);
  const groups = useMapStore((s) => s.trafficGroups);

  useEffect(() => {
    if (!map || !enabled) return;

    const markers: maplibregl.Marker[] = [];

    incidents.forEach((incident) => {
      const style = TRAFFIC_KIND_STYLE[incident.type] ?? TRAFFIC_KIND_STYLE.other;
      if (!groups[style.group]) return;

      const size = trafficPinSize(incident.severity);
      const el = document.createElement("div");
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.filter = "drop-shadow(0 1px 2px rgba(0,0,0,.4))";
      el.innerHTML = poiIconSvg(style.icon, style.color, size);

      const label = m.trafficKind[incident.type] ?? m.trafficKind.other;
      const delay =
        incident.delay_min > 0
          ? `<p>${escapeHtml(
              formatTemplate(m.map.trafficDelay, {
                minutes: String(incident.delay_min),
                minUnit: m.units.min,
              })
            )}</p>`
          : "";
      const title =
        incident.title && incident.title !== label
          ? `<p>${escapeHtml(incident.title)}</p>`
          : "";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([incident.coords.lng, incident.coords.lat])
        .setPopup(
          new maplibregl.Popup({ offset: size / 2 + 6 }).setHTML(`
          <div class="p-2 text-sm">
            <strong style="color:${style.color}">${escapeHtml(label)}</strong>
            ${title}${delay}
          </div>
        `)
        )
        .addTo(map);

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [map, incidents, enabled, groups, m]);

  return null;
}
