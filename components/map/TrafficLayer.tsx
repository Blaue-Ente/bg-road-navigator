"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { TrafficIncident } from "@/types/traffic.types";
import { escapeHtml } from "@/lib/geo/escape-html";
import { formatTemplate } from "@/lib/i18n/format-template";
import { useMapStore } from "@/lib/stores/map.store";

export interface TrafficLayerProps {
  map: Map | null;
  incidents?: TrafficIncident[];
}

export function TrafficLayer({ map, incidents = [] }: TrafficLayerProps) {
  const m = useMessages();
  const enabled = useMapStore((s) => s.layers.traffic);

  useEffect(() => {
    if (!map || !enabled) return;

    const markers: maplibregl.Marker[] = [];

    incidents.forEach((incident) => {
      const el = document.createElement("div");
      el.className = "flex h-7 w-7 items-center justify-center rounded-full";

      const colors = {
        minor: "#27AE60",
        moderate: "#F39C12",
        major: "#E74C3C",
        critical: "#C0392B",
      };

      el.style.backgroundColor = colors[incident.severity];
      el.style.border = "2px solid #fff";
      el.style.boxShadow = "0 1px 3px rgba(0,0,0,.35)";
      el.innerHTML =
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([incident.coords.lng, incident.coords.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2 text-sm">
            <strong>${escapeHtml(incident.title)}</strong>
            <p>${escapeHtml(
              formatTemplate(m.map.trafficDelay, {
                minutes: String(incident.delay_min),
                minUnit: m.units.min,
              })
            )}</p>
          </div>
        `)
        )
        .addTo(map);

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [map, incidents, enabled, m]);

  return null;
}
