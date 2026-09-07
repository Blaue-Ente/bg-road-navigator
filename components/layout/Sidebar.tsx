"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ComponentType } from "react";
import {
  CloseIcon,
  MenuIcon,
  SettingsIcon,
  TipsIcon,
  UserIcon,
  WeatherNavIcon,
} from "@/components/icons/NavIcons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useMenu } from "@/components/layout/MenuContext";
import { useOperatorMode } from "@/lib/hooks/useOperatorMode";

const MENU_ITEMS: Array<{
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { href: "/weather", label: "Време", Icon: WeatherNavIcon },
  { href: "/tips", label: "Съвети", Icon: TipsIcon },
  { href: "/profile", label: "Профил", Icon: UserIcon },
];

export function Sidebar() {
  const { open, openMenu, closeMenu } = useMenu();
  const { enabled: isOperator } = useOperatorMode();
  const pathname = usePathname();
  const isMap = pathname === "/";
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeMenu]);

  return (
    <>
      {isMap && (
        <button
          type="button"
          onClick={openMenu}
          className="fixed left-3 top-3 z-40 flex h-12 w-12 items-center justify-center rounded-full waze-panel transition hover:scale-105 active:scale-95"
          style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
          aria-label="Отвори меню"
          aria-expanded={open}
          aria-controls="app-menu"
        >
          <MenuIcon className="h-5 w-5 text-[var(--waze-text)]" />
        </button>
      )}

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeMenu}
            aria-label="Затвори"
          />
          <aside
            id="app-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-menu-title"
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl border-t border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-8 shadow-2xl"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--waze-text-muted)]/40" />
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="app-menu-title"
                className="text-lg font-bold text-[var(--waze-text)]"
              >
                Още
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={closeMenu}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--waze-surface-elevated)] text-[var(--waze-text-muted)]"
                aria-label="Затвори меню"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
              Лентата долу води към картата, маршрута, границите, общността,
              почивките и винетките. Тук са прогнозата, съветите и профилът.
            </p>

            <nav className="grid gap-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                    pathname === item.href
                      ? "bg-[var(--waze-accent-muted)] text-[var(--waze-accent)]"
                      : "text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)]"
                  }`}
                >
                  <item.Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              {isOperator && (
                <Link
                  href="/setup"
                  onClick={closeMenu}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 transition ${
                    pathname === "/setup"
                      ? "bg-[var(--waze-accent-muted)] text-[var(--waze-accent)]"
                      : "text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)]"
                  }`}
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span className="font-medium">Настройка</span>
                </Link>
              )}
              <ThemeToggle />
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
