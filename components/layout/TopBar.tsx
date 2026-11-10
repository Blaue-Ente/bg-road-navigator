"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "@/components/icons/NavIcons";
import { useMenu } from "@/components/layout/MenuContext";
import { PRODUCT_NAME } from "@/lib/constants/brand";

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

  const title = PAGE_TITLES[pathname] ?? PRODUCT_NAME;

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--waze-border)] bg-[var(--waze-surface)]">
      <div
        className="flex min-h-14 items-center gap-1 px-2"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <button
          type="button"
          onClick={openMenu}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--waze-text)]"
          aria-label="Отвори меню"
          aria-expanded={open}
          aria-controls="app-menu"
        >
          <MenuIcon size={20} />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--waze-text)]">
          {title}
        </h1>

        {user ? (
          <Link
            href="/profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--waze-accent)] text-sm font-bold text-white"
            aria-label="Профил"
          >
            {user.email.charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link
            href="/login"
            className="shrink-0 px-2 text-sm font-medium text-[var(--waze-accent-text)]"
          >
            Влез
          </Link>
        )}
      </div>
    </header>
  );
}
