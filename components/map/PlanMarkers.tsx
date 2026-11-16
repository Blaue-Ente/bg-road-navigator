"use client";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import { PRICE_BAND_COLOR } from "@/lib/fuel-prices/bands";
import {
  datexAttribution,
  formatHazardUntil,
  hazardLabel,
  hazardPopupBody,
} from "@/lib/hazards/present";
import { roadKmDisplay } from "@/lib/hazards/road-km";
import type { RoadHazard, RoadHazardKind } from "@/lib/hazards/types";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import type { MessageCatalog } from "@/lib/i18n";
import { isMapReady } from "@/lib/map/is-map-ready";
import { useRouteStore } from "@/lib/stores/route.store";
import type { PlanStop, StopKind } from "@/lib/planner/types";
import type { Locale } from "@/lib/i18n/locale";

const HAZARD_COLOR: Record<RoadHazardKind, string> = {
  roadworks: "#d97706",
  closed: "#b91c1c",
  danger: "#c2410c",
  conditions: "#1d4ed8",
};

const KIND_COLOR: Record<StopKind, string> = {
  overnight: "#6d28d9",
  charge: "#047857",
  fuel: "#b45309",
  rest: "#1d4ed8",
  sight: "#0f766e",
};

export function PlanMarkers({ map }: { map: Map | null }) {
  const m = useMessages();
  const locale = useLocale();
  const plan = useRouteStore((state) => state.tripPlan);
  const focusedStopId = useRouteStore((state) => state.focusedStopId);

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
          labelFor(stop, m),
          {
            focused: stop.id === focusedStopId,
            flags: stop.flags.length,
            onSelect: () => useRouteStore.getState().setFocusedStopId(stop.id),
          }
        )
      );
    }
    for (const hazard of plan.road_hazards ?? []) {
      markers.push(hazardMarker(map, hazard, m, locale));
    }
    const border = plan.border.chosen;
    if (border) {
      markers.push(
        marker(
          map,
          border.coords.lng,
          border.coords.lat,
          "#b91c1c",
          borderDisplayName(locale, {
            crossing_id: border.border_id,
            name_bg: border.name_bg,
            name_en: border.name_en,
          }),
          {
            focused: false,
            flags: 0,
            onSelect: () => useRouteStore.getState().setPlanDetailOpen(true),
          }
        )
      );
    }

    return () => {
      for (const item of markers) item.remove();
    };
  }, [map, plan, focusedStopId, m, locale]);

  return null;
}

function hazardMarker(
  map: Map,
  hazard: RoadHazard,
  m: MessageCatalog,
  locale: Locale
): maplibregl.Marker {
  const label = hazardLabel(hazard.kind, locale);
  const road = roadKmDisplay(hazard.road_km_bg, hazard.text_bg, locale);
  const where = road ? `${label} · ${road}` : label;
  const bodyText = hazardPopupBody(hazard, locale);
  const until = formatHazardUntil(hazard.valid_until, locale);
  const el = document.createElement("button");
  el.type = "button";
  el.className = "flex h-8 w-8 items-center justify-center";
  el.setAttribute("aria-label", `${where}. ${bodyText}`);
  const diamond = document.createElement("span");
  diamond.className = "block h-3 w-3 rotate-45 border-2 border-white shadow";
  diamond.style.background = HAZARD_COLOR[hazard.kind];
  el.append(diamond);

  const popup = document.createElement("div");
  popup.className = "max-w-xs text-sm";
  const title = document.createElement("p");
  title.className = "font-semibold";
  title.textContent = where;
  const body = document.createElement("p");
  body.textContent = bodyText;
  popup.append(title, body);
  if (until) {
    const line = document.createElement("p");
    line.textContent = `${m.sheet.hazardsUntil} ${until}`;
    popup.append(line);
  }
  const source = document.createElement("p");
  source.textContent = datexAttribution(locale);
  popup.append(source);

  return new maplibregl.Marker({ element: el })
    .setLngLat([hazard.lng, hazard.lat])
    .setPopup(
      new maplibregl.Popup({ offset: 16, closeButton: true }).setDOMContent(
        popup
      )
    )
    .addTo(map);
}

function colorFor(stop: PlanStop): string {
  if (stop.kinds.includes("fuel") && stop.price_band) {
    return PRICE_BAND_COLOR[stop.price_band];
  }
  if (stop.kinds.includes("overnight")) return KIND_COLOR.overnight;
  if (stop.kinds.includes("charge")) return KIND_COLOR.charge;
  if (stop.kinds.includes("fuel")) return KIND_COLOR.fuel;
  if (stop.kinds.includes("sight")) return KIND_COLOR.sight;
  return KIND_COLOR.rest;
}

function labelFor(stop: PlanStop, m: MessageCatalog): string {
  const bandLabel = {
    green: m.sheet.bandGreen,
    yellow: m.sheet.bandYellow,
    red: m.sheet.bandRed,
    grey: m.sheet.bandGrey,
  } as const;
  const kinds = stop.kinds.map((kind) => m.kinds[kind] ?? kind).join(", ");
  const flags = stop.flags.length > 0 ? `, ${stop.flags.length}` : "";
  const price = stop.average_label_bg ? `. ${stop.average_label_bg}` : "";
  const band = stop.price_band ? `. ${bandLabel[stop.price_band]}` : "";
  return `${stop.place_name ?? stop.title}. ${kinds}${flags}${price}${band}`;
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

  return new maplibregl.Marker({ element: el })
    .setLngLat([lng, lat])
    .addTo(map);
}
