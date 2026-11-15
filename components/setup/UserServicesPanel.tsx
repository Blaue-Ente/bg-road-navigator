"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useMemo } from "react";
import { useServiceStatus } from "@/lib/hooks/useServiceStatus";
import { WazeCard } from "@/components/ui/WazeCard";
import type { ServiceId } from "@/lib/config/service-status";

interface UserServiceCopy {
  id: ServiceId;
  title: string;
  whenOn: string;
  whenOff: string;
}

export function UserServicesPanel() {
  const m = useMessages();
  const userServices = useMemo(
    (): UserServiceCopy[] => [
      {
        id: "postgres",
        title: m.setup.msg97406ea8de,
        whenOn: m.setup.msg2ca0c5618b,
        whenOff: m.setup.msged95c33e53,
      },
      {
        id: "nakordoni",
        title: m.setup.msg6a3712454f,
        whenOn: m.setup.msg7b975853e6,
        whenOff: m.setup.msg47346ecb4a,
      },
      {
        id: "windy",
        title: m.setup.msg57f468dcf9,
        whenOn: m.setup.msg6ca25e8dea,
        whenOff: m.setup.msgf7d41274a2,
      },
      {
        id: "tomtom",
        title: m.setup.msg768e496d7c,
        whenOn: m.setup.msga67be93a69,
        whenOff: m.setup.msgddd0272fc1,
      },
      {
        id: "opencharge",
        title: m.setup.msg6c9e82c3ec,
        whenOn: m.setup.msg4c5e565b63,
        whenOff: m.setup.ev57f3,
      },
    ],
    [m]
  );
  const { data, isLoading, isError, refetch } = useServiceStatus();

  if (isLoading) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-muted)]">{m.setup.msgeaa64818de}</p>
      </WazeCard>
    );
  }

  if (isError || !data) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-secondary)]">{m.setup.msg824515b648}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-2 text-sm text-[var(--waze-accent-text)] underline"
        >{m.communityPage.msg87b6d05132}</button>
      </WazeCard>
    );
  }

  const byId = new Map(data.services.map((service) => [service.id, service]));

  return (
    <WazeCard>
      <h2 className="text-sm font-semibold text-[var(--waze-text)]">{m.setup.msgd59baec2ec}</h2>
      <p className="mt-1 mb-3 text-xs text-[var(--waze-text-muted)]">
        {m.setup.msgff46c98629}
      </p>
      <ul className="space-y-1.5">
        {userServices.map((item) => {
          const configured = byId.get(item.id)?.configured ?? false;
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--waze-text)]">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--waze-text-muted)]">
                  {configured ? item.whenOn : item.whenOff}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  configured
                    ? "bg-emerald-500/15 text-[var(--waze-ok)]"
                    : "bg-[var(--waze-surface)] text-[var(--waze-text-muted)]"
                }`}
              >
                {configured ? m.setup.msg2ae44e63a6 : m.setup.msg217cf719a3}
              </span>
            </li>
          );
        })}
      </ul>
    </WazeCard>
  );
}
