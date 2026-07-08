import { create } from "zustand";
import { GeoPoint, RouteWaypoint } from "@/types/route.types";

export interface PendingPin {
  id: string;
  category: string;
  title: string;
  description?: string;
  expiry?: string;
}

export interface MapState {
  viewport: any | null; // Mapbox GL Viewport type
  isLocating: boolean;
  pendingPin: PendingPin | null;
  selectedPin: any | null; // could be CommunityPin
  setViewport: (viewport: any | null) => void;
  setLocating: (locating: boolean) => void;
  setPendingPin: (pin: PendingPin | null) => void;
  clearPendingPin: () => void;
  setSelectedPin: (pin: any | null) => void;
}