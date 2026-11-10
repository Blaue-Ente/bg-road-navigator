"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ComponentType } from "react";
import {
  BorderIcon,
  CloseIcon,
  CommunityIcon,
  EmergencyIcon,
  FuelIcon,
  MapIcon,
  RestIcon,
  RouteIcon,
  SettingsIcon,
  TipsIcon,
  UserIcon,
  VignetteIcon,
  WeatherNavIcon,
} from "@/components/icons/NavIcons";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useMenu } from "@/components/layout/MenuContext";
import { useOperatorMode } from "@/lib/hooks/useOperatorMode";

const PRIMARY_ITEMS: Array<{
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
}> = [
  { href: "/", label: "Карта", Icon: MapIcon },
  { href: "/route", label: "Маршрут", Icon: RouteIcon },
  { href: "/borders", label: "Граници", Icon: BorderIcon },
];

const MORE_ITEMS: Array<{
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
}> = [
  { href: "/fuel", label: "Гориво", Icon: FuelIcon },
  { href: "/vignettes", label: "Винетки", Icon: VignetteIcon },
  { href: "/emergency", label: "Спешно", Icon: EmergencyIcon },
  { href: "/community", label: "Общност", Icon: CommunityIcon },
  { href: "/weather", label: "Време", Icon: WeatherNavIcon },
  { href: "/hotels", label: "Почивки", Icon: RestIcon },
  { href: "/tips", label: "Съвети", Icon: TipsIcon },
  { href: "/profile", label: "Профил", Icon: UserIcon },
];

export function Sidebar() {
  const { open, closeMenu } = useMenu();
  const { enabled: isOperator } = useOperatorMode();
  const pathname = usePathname();
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

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-50 bg-black/50"
        onClick={closeMenu}
        aria-label="Затвори"
      />
      <aside
        id="app-menu"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-menu-title"
        className="fixed z-50 overflow-y-auto border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 shadow-2xl max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[85vh] max-md:rounded-t-3xl max-md:border-t max-md:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:inset-y-0 md:left-0 md:w-[380px] md:border-r"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--waze-border)] md:hidden" />
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
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--waze-surface-elevated)] text-[var(--waze-text-secondary)]"
            aria-label="Затвори меню"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-[var(--waze-text-secondary)]">
          Гориво, винетки, спешни номера, общност и прогноза са тук.
        </p>

        <nav className="grid gap-1">
          <div className="mb-2 hidden md:grid">
            {PRIMARY_ITEMS.map((item) => (
              <MenuLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.Icon}
                active={pathname === item.href}
                onNavigate={closeMenu}
              />
            ))}
          </div>
          {MORE_ITEMS.map((item) => (
            <MenuLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.Icon}
              active={pathname === item.href}
              onNavigate={closeMenu}
            />
          ))}
          {isOperator && (
            <MenuLink
              href="/setup"
              label="Настройка"
              Icon={SettingsIcon}
              active={pathname === "/setup"}
              onNavigate={closeMenu}
            />
          )}
          <ThemeToggle />
        </nav>
      </aside>
    </>
  );
}

function MenuLink({
  href,
  label,
  Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string; size?: number }>;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm ${
        active
          ? "bg-[var(--waze-accent)] text-white"
          : "text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)]"
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </Link>
  );
}
