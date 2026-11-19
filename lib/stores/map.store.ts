import { create } from "zustand";
import {
  DEFAULT_LAYER_VISIBILITY,
  type LayerKey,
} from "@/lib/constants/map-layers";
import { TRAFFIC_GROUPS, type TrafficGroup } from "@/lib/map/traffic-kinds";
import type { ConnectorGroup } from "@/lib/fuel/filters";
import type { CommunityPinCategory } from "@/types/community.types";
import type { FuelTypeCode } from "@/types/fuel.types";
import type { GeoPoint } from "@/types/route.types";

/** What the fuel and charger layers show; an empty choice means everything. */
export interface MapFuelFilter {
  fuels: FuelTypeCode[];
  minKw: number;
  connectors: ConnectorGroup[];
}

const toggled = <T,>(list: T[], item: T): T[] =>
  list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

export type LocateStatus =
  "idle" | "locating" | "success" | "denied" | "unavailable" | "timeout";

interface MapState {
  isLocating: boolean;
  locateStatus: LocateStatus;
  userLocation: (GeoPoint & { accuracy?: number }) | null;
  layers: Record<LayerKey, boolean>;
  /** Which kinds of road events are shown while the incidents layer is on. */
  trafficGroups: Record<TrafficGroup, boolean>;
  /** Community categories shown; empty means all. */
  communityCategories: CommunityPinCategory[];
  fuelFilter: MapFuelFilter;
  toggleCommunityCategory: (category: CommunityPinCategory) => void;
  setFuelFilter: (filter: MapFuelFilter) => void;
  /** Turns every other layer off, so only this one shows. */
  showOnly: (key: LayerKey) => void;
  layersPanelOpen: boolean;
  mapError: string | null;
  view: {
    center: [number, number];
    zoom: number;
    /** The visible area, set when the map stops moving. */
    bounds?: { w: number; s: number; e: number; n: number };
  };
  setLocating: (locating: boolean) => void;
  setLocateStatus: (status: LocateStatus) => void;
  setUserLocation: (point: MapState["userLocation"]) => void;
  toggleLayer: (key: LayerKey) => void;
  toggleTrafficGroup: (group: TrafficGroup) => void;
  setLayer: (key: LayerKey, visible: boolean) => void;
  setLayersPanelOpen: (open: boolean) => void;
  setMapError: (message: string | null) => void;
  setView: (view: MapState["view"]) => void;
  /** Ask the map to fly to a place; a new token makes a new request. */
  flyRequest: { lng: number; lat: number; zoom: number; token: number } | null;
  requestFly: (target: { lng: number; lat: number; zoom?: number }) => void;
}

export const useMapStore = create<MapState>((set) => ({
  isLocating: false,
  locateStatus: "idle",
  userLocation: null,
  layers: { ...DEFAULT_LAYER_VISIBILITY },
  trafficGroups: Object.fromEntries(
    TRAFFIC_GROUPS.map((group) => [group, true])
  ) as Record<TrafficGroup, boolean>,
  communityCategories: [],
  fuelFilter: { fuels: [], minKw: 0, connectors: [] },
  toggleCommunityCategory: (category) =>
    set((state) => ({ communityCategories: toggled(state.communityCategories, category) })),
  setFuelFilter: (fuelFilter) => set({ fuelFilter }),
  showOnly: (key) =>
    set((state) => ({
      layers: Object.fromEntries(
        (Object.keys(state.layers) as LayerKey[]).map((layer) => [layer, layer === key])
      ) as Record<LayerKey, boolean>,
    })),
  layersPanelOpen: false,
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
  toggleTrafficGroup: (group) =>
    set((state) => ({
      trafficGroups: { ...state.trafficGroups, [group]: !state.trafficGroups[group] },
    })),
  setLayer: (key, visible) =>
    set((state) => ({ layers: { ...state.layers, [key]: visible } })),
  setLayersPanelOpen: (layersPanelOpen) => set({ layersPanelOpen }),
  setMapError: (mapError) => set({ mapError }),
  setView: (view) => set({ view }),
  flyRequest: null,
  requestFly: (target) =>
    set((state) => ({
      flyRequest: {
        lng: target.lng,
        lat: target.lat,
        zoom: target.zoom ?? 12,
        token: (state.flyRequest?.token ?? 0) + 1,
      },
    })),
}));
