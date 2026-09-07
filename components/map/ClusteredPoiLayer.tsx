"use client";

import { useEffect } from "react";
import type { Map, MapLayerMouseEvent } from "maplibre-gl";
import maplibregl from "maplibre-gl";
import { isMapReady } from "@/lib/map/is-map-ready";
import { escapeHtml } from "@/lib/geo/escape-html";

export interface ClusterPoi {
  id: string;
  lng: number;
  lat: number;
  title: string;
  color?: string;
  subtitle?: string;
}

interface ClusteredPoiLayerProps {
  map: Map | null;
  sourceId: string;
  points: ClusterPoi[];
  color: string;
  enabled: boolean;
}

function cleanup(map: Map, sourceId: string) {
  if (!isMapReady(map)) return;
  for (const id of [
    `${sourceId}-clusters`,
    `${sourceId}-count`,
    `${sourceId}-points`,
  ]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

export function ClusteredPoiLayer({
  map,
  sourceId,
  points,
  color,
  enabled,
}: ClusteredPoiLayerProps) {
  useEffect(() => {
    if (!isMapReady(map) || !enabled) {
      if (map && isMapReady(map)) cleanup(map, sourceId);
      return;
    }

    cleanup(map, sourceId);

    map.addSource(sourceId, {
      type: "geojson",
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 48,
      data: {
        type: "FeatureCollection",
        features: points.map((point) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [point.lng, point.lat] },
          properties: {
            id: point.id,
            title: point.title,
            subtitle: point.subtitle ?? "",
            color: point.color ?? color,
          },
        })),
      },
    });

    map.addLayer({
      id: `${sourceId}-clusters`,
      type: "circle",
      source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": color,
        "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 26],
        "circle-opacity": 0.85,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0b0f14",
      },
    });

    map.addLayer({
      id: `${sourceId}-count`,
      type: "symbol",
      source: sourceId,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-size": 12,
      },
      paint: { "text-color": "#0b0f14" },
    });

    map.addLayer({
      id: `${sourceId}-points`,
      type: "circle",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["coalesce", ["get", "color"], color],
        "circle-radius": 7,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#0b0f14",
      },
    });

    const onClusterClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;
      const clusterId = feature.properties?.cluster_id as number | undefined;
      const source = map.getSource(sourceId);
      if (!clusterId || !source || source.type !== "geojson") return;
      (source as maplibregl.GeoJSONSource)
        .getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          map.easeTo({
            center:
              feature.geometry.type === "Point"
                ? (feature.geometry.coordinates as [number, number])
                : map.getCenter(),
            zoom,
          });
        })
        .catch(() => undefined);
    };

    const onPointClick = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature || feature.geometry.type !== "Point") return;
      const coords = feature.geometry.coordinates as [number, number];
      const title = escapeHtml(String(feature.properties?.title ?? ""));
      const subtitle = escapeHtml(String(feature.properties?.subtitle ?? ""));
      new maplibregl.Popup({ offset: 12 })
        .setLngLat(coords)
        .setHTML(
          `<div class="p-2 text-sm"><strong>${title}</strong>${
            subtitle ? `<p>${subtitle}</p>` : ""
          }</div>`
        )
        .addTo(map);
    };

    map.on("click", `${sourceId}-clusters`, onClusterClick);
    map.on("click", `${sourceId}-points`, onPointClick);

    return () => {
      map.off("click", `${sourceId}-clusters`, onClusterClick);
      map.off("click", `${sourceId}-points`, onPointClick);
      cleanup(map, sourceId);
    };
  }, [map, sourceId, points, color, enabled]);

  return null;
}
