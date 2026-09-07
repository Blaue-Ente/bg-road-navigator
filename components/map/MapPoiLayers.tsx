"use client";

import { useMemo } from "react";
import type { Map } from "maplibre-gl";
import { useMapStore } from "@/lib/stores/map.store";
import { useFuelStations } from "@/lib/hooks/useFuelStations";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { ClusteredPoiLayer } from "@/components/map/ClusteredPoiLayer";
import { EUROPEAN_REST_AREAS } from "@/lib/constants/rest-areas";
import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";

const DEFAULT_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export function MapPoiLayers({ map }: { map: Map | null }) {
  const layers = useMapStore((s) => s.layers);
  const wantFuel = layers.fuel || layers.ev;
  const { data } = useFuelStations(DEFAULT_BBOX, { enabled: wantFuel });
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
                title: border.name_bg,
                subtitle: `${border.wait_time_cars} мин · коли`,
              },
            ]
          : []
      ),
    [borders]
  );

  const restPoints = useMemo(
    () =>
      EUROPEAN_REST_AREAS.map((area) => ({
        id: area.id,
        lng: area.coords.lng,
        lat: area.coords.lat,
        title: area.name,
        subtitle: area.location,
      })),
    []
  );

  const cameraPoints = useMemo(
    () =>
      BORDER_CROSSINGS.filter(
        (c) => c.webcam_urls?.length || c.nakordoni_ppid
      ).map((crossing) => ({
        id: `cam-${crossing.id}`,
        lng: crossing.coords.lng,
        lat: crossing.coords.lat,
        title: `Камера · ${crossing.name_bg}`,
        subtitle: crossing.country_pair,
      })),
    []
  );

  return (
    <>
      <ClusteredPoiLayer
        map={map}
        sourceId="poi-fuel"
        points={fuelPoints}
        color="#f59e0b"
        enabled={layers.fuel}
      />
      <ClusteredPoiLayer
        map={map}
        sourceId="poi-ev"
        points={evPoints}
        color="#22c55e"
        enabled={layers.ev}
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
