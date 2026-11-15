import { create } from "zustand";

interface TripSessionState {
  active: boolean;
  seen: string[];
  banner: string | null;
  start: () => void;
  stop: () => void;
  dismiss: () => void;
  remember: (seen: string[], banner: string) => void;
}

export const useTripSessionStore = create<TripSessionState>((set) => ({
  active: false,
  seen: [],
  banner: null,
  start: () => set({ active: true, seen: [], banner: null }),
  stop: () => set({ active: false, seen: [], banner: null }),
  dismiss: () => set({ banner: null }),
  remember: (seen, banner) => set({ seen, banner }),
}));
