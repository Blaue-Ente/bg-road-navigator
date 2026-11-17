import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapStyleChoice } from "@/lib/constants/map-style";

interface MapStyleState {
  choice: MapStyleChoice;
  setChoice: (choice: MapStyleChoice) => void;
}

/** Which map look the driver picked; "auto" follows the theme. */
export const useMapStyleStore = create<MapStyleState>()(
  persist(
    (set) => ({
      choice: "auto",
      setChoice: (choice) => set({ choice }),
    }),
    { name: "bg-road-map-style" }
  )
);
