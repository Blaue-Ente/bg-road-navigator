import { create } from "zustand";
import {
  DEFAULT_LAYER_VISIBILITY,
  type LayerKey,
} from "@/lib/constants/map-layers";
import type { GeoPoint } from "@/types/route.types";

export type LocateStatus =
  "idle" | "locating" | "success" | "denied" | "unavailable" | "timeout";

interface MapState {
  isLocating: boolean;
  locateStatus: LocateStatus;
  userLocation: (GeoPoint & { accuracy?: number }) | null;
  layers: Record<LayerKey, boolean>;
  mapError: string | null;
  view: { center: [number, number]; zoom: number };
  setLocating: (locating: boolean) => void;
  setLocateStatus: (status: LocateStatus) => void;
  setUserLocation: (point: MapState["userLocation"]) => void;
  toggleLayer: (key: LayerKey) => void;
  setLayer: (key: LayerKey, visible: boolean) => void;
  setMapError: (message: string | null) => void;
  setView: (view: MapState["view"]) => void;
}

export const useMapStore = create<MapState>((set) => ({
  isLocating: false,
  locateStatus: "idle",
  userLocation: null,
  layers: { ...DEFAULT_LAYER_VISIBILITY },
  mapError: null,
  view: { center: [23.3219, 42.6977], zoom: 7 },
  setLocating: (locating) => set({ isLocating: locating }),
  setLocateStatus: (locateStatus) =>
    set({ locateStatus, isLocating: locateStatus === "locating" }),
  setUserLocation: (userLocation) => set({ userLocation }),
  toggleLayer: (key) =>
    set((state) => ({
      layers: { ...state.layers, [key]: !state.layers[key] },
    })),
  setLayer: (key, visible) =>
    set((state) => ({ layers: { ...state.layers, [key]: visible } })),
  setMapError: (mapError) => set({ mapError }),
  setView: (view) => set({ view }),
}));
