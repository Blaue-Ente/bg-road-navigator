"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import { messages as m } from "@/lib/i18n";
import { isMapReady } from "@/lib/map/is-map-ready";
import { useRouteStore } from "@/lib/stores/route.store";
import type { PlanStop, StopKind } from "@/lib/planner/types";

const KIND_COLOR: Record<StopKind, string> = {
  overnight: "#6d28d9",
  charge: "#047857",
  fuel: "#b45309",
  rest: "#1d4ed8",
  sight: "#0f766e",
};

export function PlanMarkers({ map }: { map: Map | null }) {
  const plan = useRouteStore((state) => state.tripPlan);
  const focusedStopId = useRouteStore((state) => state.focusedStopId);

  useEffect(() => {
    if (!map || !isMapReady(map) || !plan) return;
    const markers: maplibregl.Marker[] = [];

    for (const stop of plan.stops) {
      markers.push(
        marker(map, stop.coords.lng, stop.coords.lat, colorFor(stop), labelFor(stop), {
          focused: stop.id === focusedStopId,
          flags: stop.flags.length,
          onSelect: () => useRouteStore.getState().setFocusedStopId(stop.id),
        })
      );
    }
    const border = plan.border.chosen;
    if (border) {
      markers.push(
        marker(map, border.coords.lng, border.coords.lat, "#b91c1c", border.name_bg, {
          focused: false,
          flags: 0,
          onSelect: () => useRouteStore.getState().setPlanDetailOpen(true),
        })
      );
    }

    return () => {
      for (const item of markers) item.remove();
    };
  }, [map, plan, focusedStopId]);

  return null;
}

function colorFor(stop: PlanStop): string {
  if (stop.kinds.includes("overnight")) return KIND_COLOR.overnight;
  if (stop.kinds.includes("charge")) return KIND_COLOR.charge;
  if (stop.kinds.includes("fuel")) return KIND_COLOR.fuel;
  if (stop.kinds.includes("sight")) return KIND_COLOR.sight;
  return KIND_COLOR.rest;
}

function labelFor(stop: PlanStop): string {
  const kinds = stop.kinds.map((kind) => m.kinds[kind] ?? kind).join(", ");
  const flags =
    stop.flags.length > 0 ? `, ${stop.flags.length}` : "";
  return `${stop.place_name ?? stop.title}. ${kinds}${flags}`;
}

function marker(
  map: Map,
  lng: number,
  lat: number,
  color: string,
  title: string,
  options: { focused: boolean; flags: number; onSelect: () => void }
): maplibregl.Marker {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "relative flex h-8 w-8 items-center justify-center";
  el.setAttribute("aria-label", title);
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    options.onSelect();
  });

  const dot = document.createElement("span");
  dot.className = "block h-3.5 w-3.5 rounded-full border-2 border-white shadow";
  dot.style.background = color;
  if (options.focused) {
    dot.style.boxShadow = `0 0 0 3px white, 0 0 0 5px ${color}`;
  }
  el.append(dot);

  if (options.flags > 0) {
    const badge = document.createElement("span");
    badge.className =
      "absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--waze-danger)] px-1 text-[10px] font-semibold text-white";
    badge.textContent = String(options.flags);
    el.append(badge);
  }

  return new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
}
