"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouteStore } from "@/lib/stores/route.store";
import { unitsFrom } from "@/lib/i18n/units";
import { formatDuration } from "@/lib/utils/route-planner";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { useTraffic } from "@/lib/hooks/useTraffic";
import {
  DEFAULT_COMMUNITY_BBOX,
  useCommunityPins,
} from "@/lib/hooks/useCommunityPins";
import { useCommunityStore } from "@/lib/stores/community.store";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { RouteBottomSheet } from "@/components/map/RouteBottomSheet";
import { PinDropButton } from "@/components/community/PinDropButton";
import { PinComposer } from "@/components/community/PinComposer";
import {
  CommunityIcon,
  EmergencyIcon,
  MenuIcon,
  SearchIcon,
} from "@/components/icons/NavIcons";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import { useMenu } from "@/components/layout/MenuContext";

const BULGARIA_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export default function MapPage() {
  const m = useMessages();
  const locale = useLocale();
  const units = unitsFrom(m);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const localPins = useCommunityStore((s) => s.pins);
  const isDropMode = useCommunityStore((s) => s.isDropMode);
  const dropCoords = useCommunityStore((s) => s.dropCoords);
  const { open, openMenu } = useMenu();
  const { data: borders } = useBorderStatus({ region: "bulgaria" });
  const { data: traffic } = useTraffic(BULGARIA_BBOX, 7);
  const { data: communityData } = useCommunityPins({
    bbox: DEFAULT_COMMUNITY_BBOX,
  });

  const communityPins = communityData?.pins ?? localPins;
  const topBorders = borders?.slice(0, 4) ?? [];
  const incidentCount = traffic?.incidents?.length ?? 0;
  const chipRowRef = useRef<HTMLDivElement>(null);
  const [chipRowOverflows, setChipRowOverflows] = useState(false);

  useEffect(() => {
    const el = chipRowRef.current;
    if (!el) return;
    const measure = () => {
      setChipRowOverflows(el.scrollWidth > el.clientWidth + 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [topBorders.length, incidentCount, communityPins.length]);

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

          <LocaleSwitcher className="pointer-events-auto shrink-0" />

          <Link
            href="/route"
            className="pointer-events-auto relative block h-12 min-w-0 flex-1 rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] shadow-sm"
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

      <div className="pointer-events-none absolute left-0 z-10 w-full bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-24 md:w-[380px]">
        <div
          ref={chipRowRef}
          className="flex gap-2 overflow-x-auto pb-1 pl-3 [scrollbar-width:thin]"
          style={
            chipRowOverflows
              ? {
                  maskImage: "linear-gradient(to right, black 85%, transparent)",
                  WebkitMaskImage:
                    "linear-gradient(to right, black 85%, transparent)",
                }
              : undefined
          }
        >
          {topBorders.map((border) => (
            <Link
              key={border.crossing_id}
              href="/borders"
              className="pointer-events-auto waze-panel shrink-0 px-3 py-2"
            >
              <p className="mb-1 max-w-[140px] truncate text-xs font-medium text-[var(--waze-text-secondary)]">
                {borderDisplayName(locale, {
                  crossing_id: border.crossing_id,
                  name_bg: border.name_bg,
                  name_en: border.name_en,
                  name_i18n: border.name_i18n,
                })}
              </p>
              <p className="mb-0.5 text-[10px] text-[var(--waze-text-muted)]">
                {m.home.waitNow}
              </p>
              <BorderWaitBadge
                waitMinutes={border.wait_time_cars}
                compact
              />
            </Link>
          ))}
          {incidentCount > 0 && (
            <div className="waze-panel shrink-0 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--waze-warning)]">
                <EmergencyIcon size={16} />
                {incidentCount} {m.home.incidents}
              </p>
            </div>
          )}
          {communityPins.length > 0 && (
            <Link
              href="/community"
              className="pointer-events-auto waze-panel shrink-0 px-3 py-2"
            >
              <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--waze-accent-text)]">
                <CommunityIcon size={16} />
                {communityPins.length} {m.home.signals}
              </p>
            </Link>
          )}
          <span aria-hidden className="w-20 shrink-0" />
        </div>
      </div>

      {activeRoute && <RouteBottomSheet route={activeRoute} />}
      <PinDropButton mode="map" />
      <PinComposer requireMapTap />
    </>
  );
}
