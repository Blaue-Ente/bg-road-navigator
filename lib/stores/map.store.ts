import { create } from "zustand";

export interface MapState {
  isLocating: boolean;
  setLocating: (locating: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  isLocating: false,
  setLocating: (locating) => set({ isLocating: locating }),
}));
