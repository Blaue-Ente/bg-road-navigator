"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapIcon,
  RouteIcon,
  BorderIcon,
  MoreIcon,
} from "@/components/icons/NavIcons";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useMenu } from "@/components/layout/MenuContext";

const MORE_HREFS = new Set([
  "/fuel",
  "/vignettes",
  "/emergency",
  "/community",
  "/weather",
  "/hotels",
  "/tips",
  "/profile",
  "/setup",
]);

export function BottomNav() {
  const pathname = usePathname();
  const { open, openMenu } = useMenu();
  const m = useMessages();
  const moreActive = open || MORE_HREFS.has(pathname);

  const navItems = [
    { href: "/", label: m.nav.map, Icon: MapIcon },
    { href: "/route", label: m.nav.route, Icon: RouteIcon },
    { href: "/borders", label: m.nav.borders, Icon: BorderIcon },
  ] as const;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--waze-border)] bg-[var(--waze-surface)] pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      aria-label={m.nav.mainNav}
    >
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 ${
                isActive
                  ? "text-[var(--waze-accent-text)]"
                  : "text-[var(--waze-text-secondary)]"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <item.Icon size={20} />
              <span className="text-xs font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openMenu}
          className={`flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1.5 ${
            moreActive
              ? "text-[var(--waze-accent-text)]"
              : "text-[var(--waze-text-secondary)]"
          }`}
          aria-label={m.nav.more}
          aria-expanded={open}
          aria-controls="app-menu"
        >
          <MoreIcon size={20} />
          <span className="text-xs font-medium leading-none">{m.nav.more}</span>
        </button>
      </div>
    </nav>
  );
}