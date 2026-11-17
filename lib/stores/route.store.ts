import { create } from "zustand";
import { clearRouteTripSession, tripSessionStorage } from "@/lib/stores/route-trip-session";
import type { TripPreferences } from "@/lib/planner/preferences";
import type { PlaceFlagSummary, TripPlannerResult } from "@/lib/planner/types";
import type { GeoPoint, Route, RoutePoint } from "@/types/route.types";

export interface ReplanDraft {
  token: number;
  origin: RoutePoint;
  destination: RoutePoint;
  via: RoutePoint | null;
  preferences: TripPreferences;
  departAt: string | null;
  fuelLevel: number;
  favoriteId?: string | null;
  favoriteName?: string | null;
}

export interface PlanningVia {
  label: string;
  lng: number;
  lat: number;
}

interface RouteState {
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  waypoints: GeoPoint[];
  activeRoute: Route | null;
  /** Populated from OSRM alternatives when available. */
  alternativeRoutes: Route[];
  tripPlan: TripPlannerResult | null;
  routeStatus: "idle" | "loading" | "success" | "error";
  routeError: string | null;
  planDetailOpen: boolean;
  focusedStopId: string | null;
  planningVia: PlanningVia | null;
  replanDraft: ReplanDraft | null;
  /** Stable route-choice card order (`border_id` or `source` keys). */
  choiceCardOrderKeys: string[] | null;
  setOrigin: (point: GeoPoint | null) => void;
  setDestination: (point: GeoPoint | null) => void;
  addWaypoint: (point: GeoPoint) => void;
  removeWaypoint: (index: number) => void;
  setActiveRoute: (route: Route | null) => void;
  setAlternativeRoutes: (routes: Route[]) => void;
  setTripPlan: (plan: TripPlannerResult | null) => void;
  setPlanDetailOpen: (open: boolean) => void;
  setFocusedStopId: (id: string | null) => void;
  setPlanningVia: (via: PlanningVia | null) => void;
  setReplanDraft: (draft: ReplanDraft | null) => void;
  setChoiceCardOrderKeys: (keys: string[] | null) => void;
  addLocalFlag: (stopId: string, flag: PlaceFlagSummary) => void;
  clearRoute: () => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  origin: null,
  destination: null,
  waypoints: [],
  activeRoute: null,
  alternativeRoutes: [],
  tripPlan: null,
  routeStatus: "idle",
  routeError: null,
  planDetailOpen: false,
  focusedStopId: null,
  planningVia: null,
  replanDraft: null,
  choiceCardOrderKeys: null,
  setOrigin: (point) => set({ origin: point, choiceCardOrderKeys: null }),
  setDestination: (point) =>
    set({ destination: point, choiceCardOrderKeys: null }),
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
  setTripPlan: (plan) =>
    set({
      tripPlan: plan,
      focusedStopId: null,
      ...(plan ? {} : { planDetailOpen: false }),
    }),
  setPlanDetailOpen: (open) => set({ planDetailOpen: open }),
  setFocusedStopId: (id) =>
    set((state) => ({
      focusedStopId: id,
      planDetailOpen: id ? true : state.planDetailOpen,
    })),
  setPlanningVia: (via) => set({ planningVia: via }),
  setReplanDraft: (draft) => set({ replanDraft: draft }),
  setChoiceCardOrderKeys: (keys) => set({ choiceCardOrderKeys: keys }),
  addLocalFlag: (stopId, flag) =>
    set((state) => {
      if (!state.tripPlan) return {};
      return {
        tripPlan: {
          ...state.tripPlan,
          stops: state.tripPlan.stops.map((stop) => {
            if (stop.id !== stopId) return stop;
            if (stop.flags.some((item) => item.flag === flag.flag)) return stop;
            return { ...stop, flags: [...stop.flags, flag] };
          }),
        },
      };
    }),
  clearRoute: () => {
    const storage = tripSessionStorage();
    if (storage) clearRouteTripSession(storage);
    set({
      origin: null,
      destination: null,
      waypoints: [],
      activeRoute: null,
      alternativeRoutes: [],
      tripPlan: null,
      routeStatus: "idle",
      routeError: null,
      planDetailOpen: false,
      focusedStopId: null,
      planningVia: null,
      choiceCardOrderKeys: null,
    });
  },
}));
