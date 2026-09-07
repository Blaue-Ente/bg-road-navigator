"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "@/components/icons/NavIcons";
import { useMenu } from "@/components/layout/MenuContext";

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
  "/vignettes": "Винетки",
  "/setup": "Настройка",
};

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const { open, openMenu } = useMenu();

  if (pathname === "/") return null;

  const title = PAGE_TITLES[pathname] ?? "БГ Навигатор";

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-3 pt-3">
      <div
        className="waze-panel mx-auto flex min-h-14 max-w-lg items-center gap-0 px-2 py-2"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          type="button"
          onClick={openMenu}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--waze-text)] transition hover:bg-[var(--waze-surface-elevated)]"
          aria-label="Отвори меню"
          aria-expanded={open}
          aria-controls="app-menu"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center py-1 pl-3 pr-2">
          <h1 className="w-full text-base font-semibold leading-snug break-words text-[var(--waze-text)]">
            {title}
          </h1>
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
            className="shrink-0 px-2 text-sm font-medium text-[var(--waze-accent)]"
          >
            Влез
          </Link>
        )}
      </div>
    </header>
  );
}
