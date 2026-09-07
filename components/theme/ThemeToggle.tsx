"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/stores/theme.store";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const scheme = useThemeStore((s) => s.scheme);
  const toggleScheme = useThemeStore((s) => s.toggleScheme);
  const isDark = scheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleScheme}
      className={
        compact
          ? "flex h-12 w-12 items-center justify-center rounded-full waze-panel"
          : "flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)]"
      }
      aria-label={
        isDark ? "Превключи към светла тема" : "Превключи към тъмна тема"
      }
      aria-pressed={!isDark}
    >
      {isDark ? (
        <Moon className="h-5 w-5" strokeWidth={2} aria-hidden />
      ) : (
        <Sun className="h-5 w-5" strokeWidth={2} aria-hidden />
      )}
      {!compact && (
        <span className="font-medium">
          {isDark ? "Тъмна тема (нощно шофиране)" : "Светла тема"}
        </span>
      )}
    </button>
  );
}
