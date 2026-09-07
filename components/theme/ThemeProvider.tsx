"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/stores/theme.store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useThemeStore((s) => s.scheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = scheme;
    root.style.colorScheme = scheme;
  }, [scheme]);

  return <>{children}</>;
}
