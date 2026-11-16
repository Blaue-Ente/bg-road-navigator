"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import type { Map } from "maplibre-gl";
import { escapeHtml } from "@/lib/geo/escape-html";
import { attentionTitle, hotspotDetail } from "@/lib/hotspots/present";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { Hotspot } from "@/lib/hotspots/types";
import { isMapReady } from "@/lib/map/is-map-ready";
import { useMapStore } from "@/lib/stores/map.store";

const SOURCE = "attention-hotspots";
const LAYER = "attention-hotspots";

export function HotspotLayer({ map }: { map: Map | null }) {
  const m = useMessages();
  const locale = useLocale();
  const enabled = useMapStore((state) => state.layers.hotspots);

  useEffect(() => {
    if (!enabled || !isMapReady(map)) return;

    let cancelled = false;
    const popup = new maplibregl.Popup({
      closeButton: true,
      maxWidth: "280px",
    });

    const draw = (hotspots: Hotspot[]) => {
      if (!isMapReady(map) || cancelled) return;
      const data: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: hotspots.map((hotspot) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [hotspot.lng, hotspot.lat],
          },
          properties: {
            rank:
              hotspot.fatal > 0
                ? "high"
                : hotspot.serious > 0
                  ? "medium"
                  : "low",
            label: hotspotDetail(hotspot, locale),
          },
        })),
      };
      const existing = map.getSource(SOURCE) as
        maplibregl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(data);
        return;
      }
      map.addSource(SOURCE, { type: "geojson", data });
      map.addLayer({
        id: LAYER,
        type: "circle",
        source: SOURCE,
        paint: {
          "circle-radius": 7,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
          "circle-color": [
            "match",
            ["get", "rank"],
            "high",
            "#b91c1c",
            "medium",
            "#d97706",
            "#ca8a04",
          ],
        },
      });
    };

    const load = () => {
      if (!isMapReady(map)) return;
      const bounds = map.getBounds();
      const params = new URLSearchParams({
        west: String(bounds.getWest()),
        south: String(bounds.getSouth()),
        east: String(bounds.getEast()),
        north: String(bounds.getNorth()),
      });
      void fetch(`/api/hotspots?${params.toString()}`)
        .then((response) => (response.ok ? response.json() : null))
        .then((payload: { hotspots?: Hotspot[] } | null) => {
          if (!payload || cancelled) return;
          draw(payload.hotspots ?? []);
        })
        .catch(() => undefined);
    };

    const onClick = (
      event: maplibregl.MapMouseEvent & {
        features?: maplibregl.GeoJSONFeature[];
      }
    ) => {
      const label = event.features?.[0]?.properties?.label;
      if (typeof label !== "string") return;
      popup
        .setLngLat(event.lngLat)
        .setHTML(
          `<div class="p-2 text-sm"><strong>${escapeHtml(attentionTitle(locale))}</strong><p>${escapeHtml(label)}</p></div>`
        )
        .addTo(map);
    };

    const onEnter = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const onLeave = () => {
      map.getCanvas().style.cursor = "";
    };

    if (map.isStyleLoaded()) load();
    else map.once("load", load);
    map.on("moveend", load);
    map.on("click", LAYER, onClick);
    map.on("mouseenter", LAYER, onEnter);
    map.on("mouseleave", LAYER, onLeave);

    return () => {
      cancelled = true;
      popup.remove();
      map.off("moveend", load);
      map.off("click", LAYER, onClick);
      map.off("mouseenter", LAYER, onEnter);
      map.off("mouseleave", LAYER, onLeave);
      if (isMapReady(map)) {
        if (map.getLayer(LAYER)) map.removeLayer(LAYER);
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      }
    };
  }, [map, enabled, locale]);

  return null;
}
