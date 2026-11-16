"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "@/components/icons/NavIcons";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useMenu } from "@/components/layout/MenuContext";
import { productName } from "@/lib/constants/brand";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useOperatorMode } from "@/lib/hooks/useOperatorMode";

interface TopBarProps {
  user: { id: string; email: string } | undefined;
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const { open, openMenu } = useMenu();
  const { enabled: operatorSetup } = useOperatorMode();
  const m = useMessages();
  const locale = useLocale();

  if (pathname === "/") return null;

  const titleByPath: Record<string, string> = {
    "/route": m.nav.route,
    "/borders": m.nav.borders,
    "/fuel": m.nav.fuel,
    "/emergency": m.nav.emergency,
    "/weather": m.nav.weather,
    "/community": m.nav.community,
    "/hotels": m.nav.hotels,
    "/tips": m.nav.tips,
    "/profile": m.nav.profilePage,
    "/vignettes": m.nav.vignettes,
    "/setup": operatorSetup ? m.nav.setup : m.nav.services,
  };

  const title = titleByPath[pathname] ?? productName(locale);

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
          aria-label={m.nav.openMenu}
          aria-expanded={open}
          aria-controls="app-menu"
        >
          <MenuIcon size={20} />
        </button>

        <h1 className="min-w-0 flex-1 truncate text-base font-semibold text-[var(--waze-text)]">
          {title}
        </h1>

        <LocaleSwitcher className="shrink-0" />

        {user ? (
          <Link
            href="/profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--waze-accent)] text-sm font-bold text-white"
            aria-label={m.nav.profile}
          >
            {user.email.charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link
            href="/login"
            className="shrink-0 px-2 text-sm font-medium text-[var(--waze-accent-text)]"
          >
            {m.nav.signIn}
          </Link>
        )}
      </div>
    </header>
  );
}