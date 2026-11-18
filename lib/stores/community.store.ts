import { create } from "zustand";
import type { CommunityPin, PinComment } from "@/types/community.types";
import type { GeoPoint } from "@/types/route.types";

interface CommunityState {
  pins: CommunityPin[];
  selectedPin: CommunityPin | null;
  isDropMode: boolean;
  /** Set when user taps the map (or geolocation) while composing a pin. */
  dropCoords: GeoPoint | null;
  /** A bad-road signal waits for its end: the next map tap sets it. */
  segmentPending: boolean;
  /** The far end of the bad stretch being composed. */
  dropEndCoords: GeoPoint | null;
  setSegmentPending: (pending: boolean) => void;
  setDropEndCoords: (coords: GeoPoint | null) => void;
  setPins: (pins: CommunityPin[]) => void;
  addPin: (pin: CommunityPin) => void;
  removePin: (id: string) => void;
  setPinUpvotes: (id: string, upvotes: number) => void;
  setSelectedPin: (pin: CommunityPin | null) => void;
  setDropMode: (mode: boolean) => void;
  setDropCoords: (coords: GeoPoint | null) => void;
  beginDrop: (coords?: GeoPoint | null) => void;
  cancelDrop: () => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  pins: [],
  selectedPin: null,
  isDropMode: false,
  dropCoords: null,
  segmentPending: false,
  dropEndCoords: null,
  setSegmentPending: (pending) => set({ segmentPending: pending }),
  setDropEndCoords: (coords) => set({ dropEndCoords: coords, segmentPending: false }),
  setPins: (pins) => set({ pins }),
  addPin: (pin) => set((state) => ({ pins: [pin, ...state.pins] })),
  removePin: (id) =>
    set((state) => ({
      pins: state.pins.filter((p) => p.id !== id),
      selectedPin: state.selectedPin?.id === id ? null : state.selectedPin,
    })),
  setPinUpvotes: (id, upvotes) =>
    set((state) => ({
      pins: state.pins.map((pin) =>
        pin.id === id ? { ...pin, upvotes } : pin
      ),
      selectedPin:
        state.selectedPin?.id === id
          ? { ...state.selectedPin, upvotes }
          : state.selectedPin,
    })),
  setSelectedPin: (pin) => set({ selectedPin: pin }),
  setDropMode: (mode) =>
    set((state) => ({
      isDropMode: mode,
      dropCoords: mode ? state.dropCoords : null,
    })),
  setDropCoords: (coords) => set({ dropCoords: coords }),
  beginDrop: (coords = null) =>
    set({
      isDropMode: true,
      dropCoords: coords,
      dropEndCoords: null,
      segmentPending: false,
      selectedPin: null,
    }),
  cancelDrop: () =>
    set({ isDropMode: false, dropCoords: null, dropEndCoords: null, segmentPending: false }),
}));

export type { PinComment };
