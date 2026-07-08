"use client";

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { TrafficIncident } from "@/types/traffic.types";

export interface TrafficLayerProps {
  map: mapboxgl.Map | null;
  incidents?: TrafficIncident[];
}

export function TrafficLayer({ map, incidents = [] }: TrafficLayerProps) {
  useEffect(() => {
    if (!map) return;

    // Add traffic incidents as circle markers
    incidents.forEach((incident) => {
      const el = document.createElement("div");
      el.className = "w-6 h-6 rounded-full flex items-center justify-center";

      // Color based on severity
      const colors = {
        minor: "#27AE60",
        moderate: "#F39C12",
        major: "#E74C3C",
        critical: "#C0392B"
      };

      el.style.backgroundColor = colors[incident.severity];

      const marker = new mapboxgl.Marker(el)
        .setLngLat([incident.coords.lng, incident.coords.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2 text-sm">
            <strong>${incident.title}</strong>
            <p>Задържане: ${incident.delay_min} мин.</p>
          </div>
        `))
        .addTo(map);
    });

    return () => {
      // Clean up markers
      map.getCanvas().style.cursor = "";
    };
  }, [map, incidents]);

  return null;
}