import { create } from "zustand";
import type { GeoPoint, Route } from "@/types/route.types";

interface RouteState {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  waypoints: GeoPoint[];
  activeRoute: Route | null;
  /** Populated from OSRM alternatives when available. */
  alternativeRoutes: Route[];
  routeStatus: "idle" | "loading" | "success" | "error";
  routeError: string | null;
  setOrigin: (point: GeoPoint | null) => void;
  setDestination: (point: GeoPoint | null) => void;
  addWaypoint: (point: GeoPoint) => void;
  removeWaypoint: (index: number) => void;
  setActiveRoute: (route: Route | null) => void;
  setAlternativeRoutes: (routes: Route[]) => void;
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
  addWaypoint: (point) =>
    set((state) => ({
      waypoints: [...state.waypoints, point],
    })),
  removeWaypoint: (index) =>
    set((state) => ({
      waypoints: state.waypoints.filter((_, i) => i !== index),
    })),
  setActiveRoute: (route) =>
    set({ activeRoute: route, routeStatus: "success", routeError: null }),
  setAlternativeRoutes: (routes) => set({ alternativeRoutes: routes }),
  clearRoute: () =>
    set({
      origin: null,
      destination: null,
      waypoints: [],
      activeRoute: null,
      alternativeRoutes: [],
      routeStatus: "idle",
      routeError: null,
    }),
}));
