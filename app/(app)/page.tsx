"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouteStore } from "@/lib/stores/route.store";
import { unitsFrom } from "@/lib/i18n/units";
import { formatDuration } from "@/lib/utils/route-planner";
import { PinDropButton } from "@/components/community/PinDropButton";
import { PinComposer } from "@/components/community/PinComposer";
import { MenuIcon, SearchIcon } from "@/components/icons/NavIcons";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { useMenu } from "@/components/layout/MenuContext";
import { hydrateRouteTripIntoStore } from "@/lib/stores/hydrate-route-trip";
import { useCommunityStore } from "@/lib/stores/community.store";

export default function MapPage() {
  const m = useMessages();
  const units = unitsFrom(m);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const isDropMode = useCommunityStore((s) => s.isDropMode);
  const dropCoords = useCommunityStore((s) => s.dropCoords);
  const { open, openMenu } = useMenu();

  useEffect(() => {
    hydrateRouteTripIntoStore();
  }, []);

  return (
    <>
      <div
        className="pointer-events-none absolute top-0 left-0 z-10 w-full px-3 md:w-[380px]"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top, 0px))" }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openMenu}
            className="pointer-events-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] text-[var(--waze-text)] shadow-sm"
            aria-label={m.nav.openMenu}
            aria-expanded={open}
            aria-controls="app-menu"
          >
            <MenuIcon size={20} />
          </button>

          <div className="pointer-events-auto hidden shrink-0 sm:block">
            <LocaleSwitcher />
          </div>

          <Link
            href="/route"
            className="pointer-events-auto relative block h-12 min-w-0 flex-1 rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] shadow-sm sm:min-w-0"
          >
            <SearchIcon className="absolute top-3.5 left-3 text-[var(--waze-accent-text)]" />
            <p className="m-0 h-12 truncate pr-24 pl-11 text-base font-medium leading-[48px] text-[var(--waze-text)]">
              {activeRoute
                ? `${activeRoute.origin.label} → ${activeRoute.destination.label}`
                : m.home.whereTo}
            </p>
            <span className="waze-btn-primary absolute top-1.5 right-1 inline-flex h-9 items-center px-3.5 text-sm">
              {activeRoute ? m.home.change : m.home.start}
            </span>
          </Link>
        </div>

        {activeRoute && (
          <p className="pointer-events-none mt-2 ml-14 w-fit max-w-[calc(100%-3.5rem)] truncate rounded-full bg-[var(--waze-surface)] px-3 py-1 text-xs text-[var(--waze-text-secondary)] shadow-sm">
            {activeRoute.distance_km} {m.units.km} ·{" "}
            {formatDuration(activeRoute.duration_min, units)}
          </p>
        )}

        {isDropMode && !dropCoords && (
          <div className="pointer-events-none mt-3 rounded-full bg-[var(--waze-accent)] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm">
            {m.home.dropPin}
          </div>
        )}
      </div>

      <PinDropButton mode="map" />
      <PinComposer requireMapTap />
    </>
  );
}