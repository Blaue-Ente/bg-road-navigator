"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { CommunityIcon, EmergencyIcon } from "@/components/icons/NavIcons";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { useTraffic } from "@/lib/hooks/useTraffic";
import {
  DEFAULT_COMMUNITY_BBOX,
  useCommunityPins,
} from "@/lib/hooks/useCommunityPins";
import { useCommunityStore } from "@/lib/stores/community.store";

const BULGARIA_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export function HomeMapChips({ className = "" }: { className?: string }) {
  const m = useMessages();
  const locale = useLocale();
  const localPins = useCommunityStore((s) => s.pins);
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
    <div
      data-overlay-slot="chips"
      className={`pointer-events-none w-full max-w-[min(22rem,calc(100vw-1.5rem))] md:max-w-[21rem] ${className}`.trim()}
    >
      <div
        ref={chipRowRef}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
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
            <BorderWaitBadge waitMinutes={border.wait_time_cars} compact />
          </Link>
        ))}
        {incidentCount > 0 && (
          <div className="pointer-events-auto waze-panel shrink-0 px-3 py-2">
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
        <span aria-hidden className="w-4 shrink-0" />
      </div>
    </div>
  );
}