"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";
import { ChevronLeftIcon } from "@/components/icons/NavIcons";

interface TopBarProps {
  user: { id: string; email: string } | undefined;
}

const PAGE_TITLES: Record<string, string> = {
  "/route": "Маршрут",
  "/borders": "Граници",
  "/fuel": "Гориво",
  "/emergency": "Спешно",
  "/weather": "Време",
  "/community": "Общност",
  "/hotels": "Почивки",
  "/tips": "Съвети",
  "/profile": "Профил",
};

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const title = PAGE_TITLES[pathname] ?? "БГ Навигатор";

  return (
    <header className="fixed top-0 left-0 right-0 z-30 px-3 pt-3">
      <div
        className="waze-panel mx-auto flex h-14 max-w-lg items-center gap-3 px-3"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <Link
          href="/"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--waze-surface-elevated)] text-[var(--waze-text-secondary)] transition hover:text-[var(--waze-accent)]"
          aria-label="Към картата"
        >
          <ChevronLeftIcon />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-[var(--waze-text)]">
            {title}
          </p>
          <p className="truncate text-xs text-[var(--waze-text-muted)]">
            БГ Пътен Навигатор
          </p>
        </div>

        {user ? (
          <Link
            href="/profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#4dd4ff] to-[#1a9fd4] text-sm font-bold text-[#0b0f14]"
            aria-label="Профил"
          >
            {user.email.charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link
            href="/login"
            className="shrink-0 text-sm font-medium text-[var(--waze-accent)]"
          >
            Влез
          </Link>
        )}
      </div>
    </header>
  );
}
