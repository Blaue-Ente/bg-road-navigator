import { create } from "zustand";

export interface GeoPoint {
  lng: number;
  lat: number;
}

export interface RouteWaypoint {
  id: string;
  label: string;
  coords: GeoPoint;
}

export interface Route {
  id: string;
  origin: RouteWaypoint;
  destination: RouteWaypoint;
  waypoints: RouteWaypoint[];
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
}

interface RouteState {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  waypoints: GeoPoint[];
  activeRoute: Route | null;
  alternativeRoutes: Route[];
  routeStatus: "idle" | "loading" | "success" | "error";
  routeError: string | null;
  setOrigin: (point: GeoPoint | null) => void;
  setDestination: (point: GeoPoint | null) => void;
  addWaypoint: (point: GeoPoint) => void;
  removeWaypoint: (index: number) => void;
  setActiveRoute: (route: Route | null) => void;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  origin: null,
  destination: null,
  waypoints: [],
  activeRoute: null,
  alternativeRoutes: [],
  routeStatus: "idle",
  routeError: null,
  setOrigin: (point) => set({ origin: point }),
  setDestination: (point) => set({ destination: point }),
  addWaypoint: (point) => set((state) => ({ 
    waypoints: [...state.waypoints, point] 
  })),
  removeWaypoint: (index) => set((state) => ({
    waypoints: state.waypoints.filter((_, i) => i !== index)
  })),
  setActiveRoute: (route) => set({ activeRoute: route, routeStatus: "success" }),
  clearRoute: () => set({
    origin: null,
    destination: null,
    waypoints: [],
    activeRoute: null,
    alternativeRoutes: [],
    routeStatus: "idle",
    routeError: null
  }),
}));