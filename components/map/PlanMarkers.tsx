"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import { escapeHtml } from "@/lib/geo/escape-html";
import { isMapReady } from "@/lib/map/is-map-ready";
import { useRouteStore } from "@/lib/stores/route.store";
import type { PlanStop } from "@/lib/planner/types";

const KIND_COLOR: Record<string, string> = {
  overnight: "#6d28d9",
  charge: "#047857",
  fuel: "#b45309",
  rest: "#1d4ed8",
};

export function PlanMarkers({ map }: { map: Map | null }) {
  const plan = useRouteStore((state) => state.tripPlan);

  useEffect(() => {
    if (!map || !isMapReady(map) || !plan) return;
    const markers: maplibregl.Marker[] = [];

    for (const stop of plan.stops) {
      markers.push(
        marker(
          map,
          stop.coords.lng,
          stop.coords.lat,
          colorFor(stop),
          stop.title,
          stop.reason
        )
      );
    }
    const border = plan.border.chosen;
    if (border) {
      markers.push(
        marker(
          map,
          border.coords.lng,
          border.coords.lat,
          "#b91c1c",
          border.name_bg,
          `${border.reason} ${border.wait.age_label}`
        )
      );
    }

    return () => {
      for (const item of markers) item.remove();
    };
  }, [map, plan]);

  return null;
}

function colorFor(stop: PlanStop): string {
  if (stop.kinds.includes("overnight")) return KIND_COLOR.overnight;
  if (stop.kinds.includes("charge")) return KIND_COLOR.charge;
  if (stop.kinds.includes("fuel")) return KIND_COLOR.fuel;
  return KIND_COLOR.rest;
}

function marker(
  map: Map,
  lng: number,
  lat: number,
  color: string,
  title: string,
  detail: string
): maplibregl.Marker {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "h-3.5 w-3.5 rounded-full border-2 border-white shadow";
  el.style.background = color;
  el.setAttribute("aria-label", title);
  return new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .setPopup(
      new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(
        `<strong>${escapeHtml(title)}</strong><br/>${escapeHtml(detail)}`
      )
    )
    .addTo(map);
}
