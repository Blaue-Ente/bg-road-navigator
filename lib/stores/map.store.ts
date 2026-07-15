import { create } from "zustand";
import type { CommunityPin } from "@/types/community.types";

export interface PendingPin {
  id: string;
  category: string;
  title: string;
  description?: string;
  expiry?: string;
}

export interface MapState {
  isLocating: boolean;
  pendingPin: PendingPin | null;
  selectedPin: CommunityPin | null;
  setLocating: (locating: boolean) => void;
  setPendingPin: (pin: PendingPin | null) => void;
  clearPendingPin: () => void;
  setSelectedPin: (pin: CommunityPin | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  isLocating: false,
  pendingPin: null,
  selectedPin: null,
  setLocating: (locating) => set({ isLocating: locating }),
  setPendingPin: (pin) => set({ pendingPin: pin }),
  clearPendingPin: () => set({ pendingPin: null }),
  setSelectedPin: (pin) => set({ selectedPin: pin }),
}));
