import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorScheme = "dark" | "light";

interface ThemeState {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      scheme: "dark",
      setScheme: (scheme) => set({ scheme }),
      toggleScheme: () =>
        set({ scheme: get().scheme === "dark" ? "light" : "dark" }),
    }),
    { name: "bg-road-theme" }
  )
);
