import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  readStoredThemeJson,
  resolveInitialColorScheme,
} from "@/lib/theme/initial-scheme";

export type ColorScheme = "dark" | "light";

interface ThemeState {
  scheme: ColorScheme;
  setScheme: (scheme: ColorScheme) => void;
  toggleScheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      scheme: "light",
      setScheme: (scheme) => set({ scheme }),
      toggleScheme: () =>
        set({ scheme: get().scheme === "dark" ? "light" : "dark" }),
    }),
    {
      name: "bg-road-theme",
      onRehydrateStorage: () => (state) => {
        if (!state || typeof window === "undefined") return;
        const stored = readStoredThemeJson();
        if (stored) return;
        const fromDom = document.documentElement.dataset.theme;
        if (fromDom === "light" || fromDom === "dark") {
          state.setScheme(fromDom);
          return;
        }
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        state.setScheme(resolveInitialColorScheme(null, prefersDark));
      },
    }
  )
);
