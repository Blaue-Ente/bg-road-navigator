"use client";

import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import { useMapStore } from "@/lib/stores/map.store";

const SOURCE_ID = "tomtom-flow";
const LAYER_ID = "tomtom-flow-layer";

/** A browser-side TomTom key limited to this site's domain (see .env.example). */
export function flowTilesKey(): string | null {
  const key = process.env.NEXT_PUBLIC_TOMTOM_TILES_KEY?.trim();
  return key ? key : null;
}

/**
 * TomTom flow tile URL template. The style "relative0" cannot be combined with
 * `thickness` (TomTom answers 400 "Invalid combination of the style and
 * thickness parameter"), so only `tileSize` is sent. 512 px tiles cover four
 * times the area of 256 px ones: fewer calls.
 */
export function flowTileUrl(key: string): string {
  return `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png?key=${key}&tileSize=512`;
}

/** First symbol layer of the style, so road names and labels stay above the colours. */
function firstSymbolLayer(map: Map): string | undefined {
  return map.getStyle().layers?.find((layer) => layer.type === "symbol")?.id;
}

/**
 * Traffic intensity as coloured roads (TomTom raster flow tiles, "relative0":
 * free flow green, slow yellow, heavy red, closed dark). The tiles come straight
 * from TomTom to the browser, so they use its 200,000 tile calls a day, not the
 * small Incident Details allowance, and nothing of TomTom's is stored by us.
 */
export function TrafficFlowLayer({ map }: { map: Map | null }) {
  const enabled = useMapStore((s) => s.layers.trafficFlow);

  useEffect(() => {
    const key = flowTilesKey();
    if (!map || !enabled || !key) return;

    const add = () => {
      if (map.getSource(SOURCE_ID)) return;
      map.addSource(SOURCE_ID, {
        type: "raster",
        tiles: [flowTileUrl(key)],
        tileSize: 512,
        minzoom: 6,
        maxzoom: 18,
        attribution: "© TomTom",
      });
      map.addLayer(
        {
          id: LAYER_ID,
          type: "raster",
          source: SOURCE_ID,
          minzoom: 6,
          paint: { "raster-opacity": 0.85 },
        },
        firstSymbolLayer(map)
      );
    };

    if (map.isStyleLoaded()) add();
    else map.once("style.load", add);

    return () => {
      map.off("style.load", add);
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch {
        // The map is already being torn down.
      }
    };
  }, [map, enabled]);

  return null;
}
