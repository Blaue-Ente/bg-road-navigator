"use client";

import { useEffect } from "react";
import type { Map, MapLayerMouseEvent } from "maplibre-gl";
import maplibregl from "maplibre-gl";
import { isMapReady } from "@/lib/map/is-map-ready";
import { escapeHtml } from "@/lib/geo/escape-html";
import {
  drawPoiIcon,
  poiIconId,
  type PoiIcon,
} from "@/lib/map/poi-icons";

export interface ClusterPoi {
  id: string;
  lng: number;
  lat: number;
  title: string;
  color?: string;
  subtitle?: string;
  glyph?: string;
  /** Own pictogram; overrides the layer icon. */
  icon?: PoiIcon;
}

interface ClusteredPoiLayerProps {
  map: Map | null;
  sourceId: string;
  points: ClusterPoi[];
  color: string;
  enabled: boolean;
  /** Pictogram for single points; clusters stay numbered circles. */
  icon?: PoiIcon;
  /** Text before the navigation links in the popup. Omit for no links. */
  navigateLabel?: string;
}

function isApple(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/** Navigation links for one point: Google Maps, Waze, and Apple Maps on iOS. */
function navigationLinks(lng: number, lat: number): string {
  const target = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const links = [
    [
      "Google Maps",
      `https://www.google.com/maps/dir/?api=1&destination=${target}&travelmode=driving`,
    ],
    ["Waze", `https://waze.com/ul?ll=${target}&navigate=yes`],
  ];
  if (isApple()) {
    links.unshift(["Apple Maps", `https://maps.apple.com/?daddr=${target}&dirflg=d`]);
  }
  return links
    .map(
      ([name, url]) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:6px 8px 0 0;padding:8px 12px;border-radius:12px;background:#1e40af;color:#fff;font-weight:600;text-decoration:none">${name}</a>`
    )
    .join("");
}

function cleanup(map: Map, sourceId: string) {
  if (!isMapReady(map)) return;
  for (const id of [
    `${sourceId}-clusters`,
    `${sourceId}-count`,
    `${sourceId}-points`,
    `${sourceId}-glyph`,
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
  icon,
  navigateLabel,
}: ClusteredPoiLayerProps) {
  useEffect(() => {
    if (!isMapReady(map) || !enabled) {
      if (map && isMapReady(map)) cleanup(map, sourceId);
      return;
    }

    cleanup(map, sourceId);

    // Each point's pin is its own pictogram on its own colour; one image per pair.
    const pinIds = points.map((point) => {
      const pinIcon = point.icon ?? icon;
      if (!pinIcon) return null;
      const pinColor = point.color ?? color;
      const id = poiIconId(pinIcon, pinColor);
      if (!map.hasImage(id)) {
        const image = drawPoiIcon(pinIcon, pinColor);
        if (image) map.addImage(id, image, { pixelRatio: 2 });
      }
      return map.hasImage(id) ? id : null;
    });
    const useIcon = pinIds.length > 0 && pinIds.every(Boolean);

    map.addSource(sourceId, {
      type: "geojson",
      cluster: true,
      clusterMaxZoom: 12,
      clusterRadius: 48,
      data: {
        type: "FeatureCollection",
        features: points.map((point, index) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [point.lng, point.lat] },
          properties: {
            id: point.id,
            title: point.title,
            subtitle: point.subtitle ?? "",
            color: point.color ?? color,
            glyph: point.glyph ?? "",
            iconId: pinIds[index] ?? "",
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

    if (useIcon) {
      map.addLayer({
        id: `${sourceId}-points`,
        type: "symbol",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": ["get", "iconId"],
          "icon-size": 0.85,
          "icon-allow-overlap": true,
        },
      });
    } else {
      map.addLayer({
        id: `${sourceId}-points`,
        type: "circle",
        source: sourceId,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["coalesce", ["get", "color"], color],
          "circle-radius": 11,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#0b0f14",
        },
      });
    }

    if (!useIcon) map.addLayer({
      id: `${sourceId}-glyph`,
      type: "symbol",
      source: sourceId,
      filter: ["!", ["has", "point_count"]],
      layout: {
        "text-field": ["get", "glyph"],
        "text-size": 11,
        "text-font": ["Noto Sans Bold"],
      },
      paint: { "text-color": "#ffffff" },
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
          }${
            navigateLabel
              ? `<p style="margin-top:8px">${escapeHtml(navigateLabel)}</p><div>${navigationLinks(coords[0], coords[1])}</div>`
              : ""
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
  }, [map, sourceId, points, color, enabled, icon, navigateLabel]);

  return null;
}
