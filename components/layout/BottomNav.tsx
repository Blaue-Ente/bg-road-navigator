"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapIcon,
  RouteIcon,
  BorderIcon,
  FuelIcon,
  EmergencyIcon,
} from "@/components/icons/NavIcons";

const NAV_ITEMS = [
  { href: "/", label: "Карта", Icon: MapIcon },
  { href: "/route", label: "Маршрут", Icon: RouteIcon },
  { href: "/borders", label: "Граници", Icon: BorderIcon },
  { href: "/fuel", label: "Горива", Icon: FuelIcon },
  { href: "/emergency", label: "Спешно", Icon: EmergencyIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const isMap = pathname === "/";

  return (
    <nav
      className={`fixed z-30 ${
        isMap
          ? "bottom-4 left-3 right-3"
          : "bottom-3 left-3 right-3"
      }`}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="waze-panel mx-auto flex max-w-lg items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/" && pathname === "/(app)");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[48px] min-w-[52px] flex-col items-center justify-center rounded-xl px-2 py-1 transition-all ${
                isActive
                  ? "bg-[var(--waze-accent-muted)] text-[var(--waze-accent)]"
                  : "text-[var(--waze-text-muted)] hover:text-[var(--waze-text-secondary)]"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <item.Icon className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
