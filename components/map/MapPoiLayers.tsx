"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";

import { useEffect, useMemo, useState } from "react";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { Map } from "maplibre-gl";
import { useMapStore } from "@/lib/stores/map.store";
import { useFuelStations } from "@/lib/hooks/useFuelStations";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { ClusteredPoiLayer } from "@/components/map/ClusteredPoiLayer";
import {
  EUROPEAN_REST_AREAS,
  restAreaLocation,
  restAreaName,
} from "@/lib/constants/rest-areas";
import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";

const DEFAULT_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };
/** Below this zoom the view is too wide for a useful station search. */
const MIN_STATION_ZOOM = 8;

interface MapView {
  bbox: { w: number; s: number; e: number; n: number };
  zoom: number;
}

function readView(map: Map): MapView {
  const bounds = map.getBounds();
  // Rounded so small pans reuse the cached answer.
  const round = (value: number) => Math.round(value * 10) / 10;
  return {
    bbox: {
      w: round(bounds.getWest()),
      s: round(bounds.getSouth()),
      e: round(bounds.getEast()),
      n: round(bounds.getNorth()),
    },
    zoom: map.getZoom(),
  };
}

/** The visible area, updated when the map stops moving. */
function useMapView(map: Map | null, enabled: boolean): MapView | null {
  const [view, setView] = useState<MapView | null>(null);
  useEffect(() => {
    if (!map || !enabled) return;
    const update = () => setView(readView(map));
    update();
    map.on("moveend", update);
    return () => {
      map.off("moveend", update);
    };
  }, [map, enabled]);
  return view;
}

export function MapPoiLayers({ map }: { map: Map | null }) {
  const m = useMessages();
  const locale = useLocale();
  const layers = useMapStore((s) => s.layers);
  const wantFuel = layers.fuel || layers.ev;
  const view = useMapView(map, wantFuel);
  const zoomedIn = view == null || view.zoom >= MIN_STATION_ZOOM;
  const { data } = useFuelStations(view?.bbox ?? DEFAULT_BBOX, {
    enabled: wantFuel && view != null && zoomedIn,
  });
  const { data: borders } = useBorderStatus({
    region: "bulgaria",
    enabled: layers.borders || layers.cameras,
  });

  const fuelPoints = useMemo(
    () =>
      (data?.fuelStations ?? []).map((station) => ({
        id: station.id,
        lng: station.coords.lng,
        lat: station.coords.lat,
        title: station.brand || station.name,
        subtitle: station.address,
      })),
    [data?.fuelStations]
  );

  const evPoints = useMemo(
    () =>
      (data?.evStations ?? []).map((station) => ({
        id: station.id,
        lng: station.coords.lng,
        lat: station.coords.lat,
        title: station.name,
        subtitle: station.operator,
      })),
    [data?.evStations]
  );

  const borderPoints = useMemo(
    () =>
      (borders ?? []).flatMap((border) =>
        border.coords
          ? [
              {
                id: border.crossing_id,
                lng: border.coords.lng,
                lat: border.coords.lat,
                title: borderDisplayName(locale, {
                  crossing_id: border.crossing_id,
                  name_bg: border.name_bg,
                  name_en: border.name_en,
                  name_i18n: border.name_i18n,
                }),
                subtitle: formatTemplate(m.map.borderWaitCars, {
                  minutes: String(border.wait_time_cars),
                  minUnit: m.units.min,
                  cars: m.map.cars,
                }),
              },
            ]
          : []
      ),
    [borders, locale, m]
  );

  const restPoints = useMemo(
    () =>
      EUROPEAN_REST_AREAS.map((area) => ({
        id: area.id,
        lng: area.coords.lng,
        lat: area.coords.lat,
        title: restAreaName(locale, area),
        subtitle: restAreaLocation(locale, area),
      })),
    [locale]
  );

  const cameraPoints = useMemo(
    () =>
      BORDER_CROSSINGS.filter(
        (c) => c.webcam_urls?.length || c.nakordoni_ppid
      ).map((crossing) => ({
        id: `cam-${crossing.id}`,
        lng: crossing.coords.lng,
        lat: crossing.coords.lat,
        title: formatTemplate(m.map.cameraMarker, {
          name: borderDisplayName(locale, crossing),
        }),
        subtitle: crossing.country_pair,
      })),
    [locale, m]
  );

  return (
    <>
      {wantFuel && !zoomedIn && (
        <p
          role="status"
          className="waze-panel pointer-events-none absolute left-1/2 top-28 z-20 max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 px-3 py-2 text-center text-xs text-[var(--waze-text-secondary)]"
        >
          {m.map.zoomForStations}
        </p>
      )}
      <ClusteredPoiLayer
        map={map}
        sourceId="poi-fuel"
        points={fuelPoints}
        color="#f59e0b"
        enabled={layers.fuel && zoomedIn}
      />
      <ClusteredPoiLayer
        map={map}
        sourceId="poi-ev"
        points={evPoints}
        color="#22c55e"
        enabled={layers.ev && zoomedIn}
      />
      <ClusteredPoiLayer
        map={map}
        sourceId="poi-borders"
        points={borderPoints}
        color="#38bdf8"
        enabled={layers.borders}
      />
      <ClusteredPoiLayer
        map={map}
        sourceId="poi-rest"
        points={restPoints}
        color="#a78bfa"
        enabled={layers.rest}
      />
      <ClusteredPoiLayer
        map={map}
        sourceId="poi-cameras"
        points={cameraPoints}
        color="#fb7185"
        enabled={layers.cameras}
      />
    </>
  );
}
