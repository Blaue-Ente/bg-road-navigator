import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Switches kept on this device only. */
interface SettingsState {
  /** Record each generated plan in the route history (signed-in drivers). */
  historyRecording: boolean;
  /** Measure border waits from positions during a trip (needs location allowed). */
  borderWatch: boolean;
  setHistoryRecording: (value: boolean) => void;
  setBorderWatch: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      historyRecording: true,
      borderWatch: true,
      setHistoryRecording: (historyRecording) => set({ historyRecording }),
      setBorderWatch: (borderWatch) => set({ borderWatch }),
    }),
    { name: "bg-road-settings" }
  )
);

/** Local storage keys this app writes, for "clear data on this device". */
export const LOCAL_DATA_KEYS = [
  "bg-road-user",
  "bg-road-map-style",
  "bg-road-checklist",
  "bg-road-planner-draft",
  "bg-road-trip-session",
  "bg-road-location",
  "bg-road-locale-offer",
  "bg-road-turn-beta",
  "bg-road-settings",
  "bg-road-border-pins",
] as const;
