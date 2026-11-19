import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MAX_PINNED_BORDERS } from "@/lib/borders/list-view";

interface BorderPinsState {
  /** Crossing ids in the order they were pinned; at most three. */
  pinned: string[];
  /** False when three are already pinned. */
  pin: (id: string) => boolean;
  unpin: (id: string) => void;
}

/** The driver's favourite crossings, kept on this device. */
export const useBorderPinsStore = create<BorderPinsState>()(
  persist(
    (set, get) => ({
      pinned: [],
      pin: (id) => {
        const { pinned } = get();
        if (pinned.includes(id)) return true;
        if (pinned.length >= MAX_PINNED_BORDERS) return false;
        set({ pinned: [...pinned, id] });
        return true;
      },
      unpin: (id) => set((state) => ({ pinned: state.pinned.filter((item) => item !== id) })),
    }),
    { name: "bg-road-border-pins" }
  )
);
