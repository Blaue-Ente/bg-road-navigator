"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import type { TrafficIncident } from "@/types/traffic.types";
import { escapeHtml } from "@/lib/geo/escape-html";
import { useMapStore } from "@/lib/stores/map.store";

export interface TrafficLayerProps {
  map: Map | null;
  incidents?: TrafficIncident[];
}

export function TrafficLayer({ map, incidents = [] }: TrafficLayerProps) {
  const enabled = useMapStore((s) => s.layers.traffic);

  useEffect(() => {
    if (!map || !enabled) return;

    const markers: maplibregl.Marker[] = [];

    incidents.forEach((incident) => {
      const el = document.createElement("div");
      el.className = "flex h-6 w-6 items-center justify-center rounded-full";

      const colors = {
        minor: "#27AE60",
        moderate: "#F39C12",
        major: "#E74C3C",
        critical: "#C0392B",
      };

      el.style.backgroundColor = colors[incident.severity];

      const marker = new maplibregl.Marker(el)
        .setLngLat([incident.coords.lng, incident.coords.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2 text-sm">
            <strong>${escapeHtml(incident.title)}</strong>
            <p>Задържане: ${escapeHtml(String(incident.delay_min))} мин.</p>
          </div>
        `)
        )
        .addTo(map);

      markers.push(marker);
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [map, incidents, enabled]);

  return null;
}
