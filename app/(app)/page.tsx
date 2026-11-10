"use client";

import Link from "next/link";
import { useRouteStore } from "@/lib/stores/route.store";
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
import { useMenu } from "@/components/layout/MenuContext";

const BULGARIA_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export default function MapPage() {
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
            aria-label="Отвори меню"
            aria-expanded={open}
            aria-controls="app-menu"
          >
            <MenuIcon size={20} />
          </button>

          <Link
            href="/route"
            className="pointer-events-auto relative block h-12 min-w-0 flex-1 rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] shadow-sm"
          >
            <SearchIcon className="absolute top-3.5 left-3 text-[var(--waze-accent-text)]" />
            <p className="m-0 h-12 truncate pr-24 pl-11 text-base font-medium leading-[48px] text-[var(--waze-text)]">
              {activeRoute
                ? `${activeRoute.origin.label} → ${activeRoute.destination.label}`
                : "Къде отивате?"}
            </p>
            <span className="waze-btn-primary absolute top-1.5 right-1 inline-flex h-9 items-center px-3.5 text-sm">
              {activeRoute ? "Промени" : "Тръгни"}
            </span>
          </Link>
        </div>

        {activeRoute && (
          <p className="pointer-events-none mt-2 ml-14 w-fit max-w-[calc(100%-3.5rem)] truncate rounded-full bg-[var(--waze-surface)] px-3 py-1 text-xs text-[var(--waze-text-secondary)] shadow-sm">
            {activeRoute.distance_km} км · {formatDuration(activeRoute.duration_min)}
          </p>
        )}

        {isDropMode && !dropCoords && (
          <div className="pointer-events-none mt-3 rounded-full bg-[var(--waze-accent)] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm">
            Докоснете картата за позиция на сигнала
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-0 z-10 w-full px-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-4 md:w-[380px]">
        <div className="flex gap-2 overflow-x-auto pb-1 pr-16 md:pr-1">
          {topBorders.map((border) => (
            <Link
              key={border.crossing_id}
              href="/borders"
              className="pointer-events-auto waze-panel shrink-0 px-3 py-2"
            >
              <p className="mb-1 max-w-[140px] truncate text-xs font-medium text-[var(--waze-text-secondary)]">
                {border.name_bg}
              </p>
              <BorderWaitBadge waitMinutes={border.wait_time_cars} compact />
            </Link>
          ))}
          {incidentCount > 0 && (
            <div className="waze-panel shrink-0 px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--waze-warning)]">
                <EmergencyIcon size={16} />
                {incidentCount} инцидента
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
                {communityPins.length} сигнала
              </p>
            </Link>
          )}
        </div>
      </div>

      {activeRoute && <RouteBottomSheet route={activeRoute} />}
      <PinDropButton mode="map" />
      <PinComposer requireMapTap />
    </>
  );
}
