import type { ColorScheme } from "@/lib/stores/theme.store";

const STORAGE_KEY = "bg-road-theme";

/** Mirrors the inline boot script: stored choice wins, else system preference. */
export function resolveInitialColorScheme(
  storedJson: string | null,
  prefersDark: boolean
): ColorScheme {
  if (storedJson) {
    try {
      const parsed = JSON.parse(storedJson) as {
        state?: { scheme?: string };
      };
      const scheme = parsed?.state?.scheme;
      if (scheme === "light" || scheme === "dark") return scheme;
    } catch {
      // ignore corrupt storage
    }
  }
  return prefersDark ? "dark" : "light";
}

export function readStoredThemeJson(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}