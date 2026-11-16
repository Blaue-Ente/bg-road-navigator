"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import { formatTemplate } from "@/lib/i18n/format-template";

import { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { BorderCard } from "@/components/borders/BorderCard";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { formatZonedDateTimeLabel } from "@/lib/planner/border-wait-view";
import { BorderWebcam } from "@/components/borders/BorderWebcam";
import { BorderStatsChart } from "@/components/borders/BorderStatsChart";
import { BorderAlternatives } from "@/components/borders/BorderAlternatives";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { useCommunityPins } from "@/lib/hooks/useCommunityPins";
import { formatPinAge, communityPinLabel } from "@/lib/constants/community-pins";
import { nearestBgBorderPoint } from "@/lib/geo/border-on-route";
import type { EuropeanBorderRegion } from "@/lib/constants/european-borders";

type TabId = "bulgaria" | "europe" | "route";

export default function BorderPage() {
  const m = useMessages();
  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-[var(--waze-text-secondary)]">{m.bordersPage.msg94b2a38a43}</div>
      }
    >
      <BorderPageContent />
    </Suspense>
  );
}

function BorderPageContent() {
  const m = useMessages();
  const locale = useLocale();
  const tabs = useMemo(
    (): { id: TabId; label: string; region: EuropeanBorderRegion }[] => [
      { id: "bulgaria", label: m.bordersPage.tabBulgaria, region: "bulgaria" },
      { id: "europe", label: m.bordersPage.tabEurope, region: "all" },
      { id: "route", label: m.bordersPage.tabOnRoute, region: "route" },
    ],
    [m]
  );
  const searchParams = useSearchParams();
  const routeMode = searchParams.get("route") === "1";
  const borderIdsParam = searchParams.get("border_ids");
  const borderIds = borderIdsParam
    ? borderIdsParam.split(",").filter(Boolean)
    : undefined;

  const [activeTab, setActiveTab] = useState<TabId>(
    routeMode || borderIds?.length ? "route" : "bulgaria"
  );

  const fetchOptions = useMemo(() => {
    if (activeTab === "route" && borderIds?.length) {
      return { borderIds, region: "route" as const, enabled: true };
    }
    if (activeTab === "route") {
      return { region: "route" as const, enabled: false };
    }
    if (activeTab === "bulgaria") {
      return { region: "bulgaria" as const, enabled: true };
    }
    return { region: "all" as const, enabled: true };
  }, [activeTab, borderIds]);

  const {
    data: borderStatus,
    isLoading,
    error,
  } = useBorderStatus(fetchOptions);

  const queueReports = useCommunityPins({
    bbox: { west: 22, south: 41, east: 29, north: 44.5 },
  });
  const borderQueues = (queueReports.data?.pins ?? []).filter(
    (pin) => pin.category === "border_queue"
  );

  const displayedBorders = useMemo(() => {
    if (!borderStatus) return [];
    if (activeTab === "europe") {
      return borderStatus.filter((b) => b.region !== "bulgaria");
    }
    return borderStatus;
  }, [borderStatus, activeTab]);

  if (isLoading && fetchOptions.enabled !== false) {
    return (
      <div className="px-4 py-16 text-center text-sm text-[var(--waze-text-secondary)]">{m.bordersPage.msg94b2a38a43}</div>
    );
  }

  if (error || !borderStatus) {
    return (
      <div className="p-8 text-center text-sm text-[var(--waze-danger)]">{m.bordersPage.msgcfb43299fd}<button
          onClick={() => window.location.reload()}
          className="mt-4 block text-[var(--waze-accent-text)]"
        >{m.fuelPage.retry}</button>
      </div>
    );
  }

  const hasLiveData = displayedBorders.some(
    (b) => b.data_source === "nakordoni"
  );
  const hasHatarinfo = displayedBorders.some(
    (b) => b.data_source === "hatarinfo"
  );

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={m.bordersPage.msgf071ab10f5}
          subtitle={m.bordersPage.msgdf64f77529}
        />

        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-[var(--waze-accent-muted)] text-[var(--waze-accent-text)] ring-1 ring-[var(--waze-accent)]/40"
                  : "bg-[var(--waze-surface-elevated)] text-[var(--waze-text-secondary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "route" && !borderIds?.length && (
          <p className="mb-4 rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-3 text-sm text-[var(--waze-warning)]">{m.bordersPage.msg7d4bda760d}</p>
        )}

        <p className="mb-6 text-xs text-[var(--waze-text-muted)]">
          {hasLiveData
            ? m.bordersPage.msgabdf29bd07
            : hasHatarinfo
              ? m.bordersPage.hRinf3cf6
              : m.bordersPage.msg37acf7bd69}
        </p>

        <WazeCard className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--waze-text)]">{m.bordersPage.msg5642af6032}</h2>
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
            {m.bordersPage.msgf58032a3e9}
          </p>
          <Link
            href="/vignettes"
            className="mt-3 inline-flex text-sm font-medium text-[var(--waze-accent-text)] hover:underline"
          >{m.bordersPage.msg4b007ed953}</Link>
        </WazeCard>

        <WazeCard className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--waze-text)]">{m.bordersPage.msg2f5d8616cd}</h2>
          {borderQueues.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
              {m.bordersPage.msgb516367234}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {borderQueues.slice(0, 6).map((pin) => {
                const crossing = nearestBgBorderPoint(pin.coords, 25);
                return (
                  <li key={pin.id} className="text-sm text-[var(--waze-text)]">
                    <span className="font-medium">
                      {crossing
                        ? borderDisplayName(locale, {
                            id: crossing.id,
                            name_bg: crossing.name_bg,
                            name_en: crossing.name_en,
                          })
                        : communityPinLabel(pin.category, locale)}
                    </span>
                    <span className="text-[var(--waze-text-secondary)]">
                      {" "}
                      · {formatPinAge(pin.created_at, locale)}
                      {pin.description ? ` · ${pin.description}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </WazeCard>

        <div className="grid gap-4">
          {displayedBorders.length === 0 ? (
            <p className="text-center text-sm text-[var(--waze-text-secondary)]">{m.bordersPage.msg263c0ce6e0}</p>
          ) : (
            displayedBorders.map((border) => (
              <WazeCard key={border.crossing_id} className="!p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <BorderCard border={border} />
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[10px] text-[var(--waze-text-muted)]">{m.home.waitNow}</p>
                    <BorderWaitBadge
                      waitMinutes={border.wait_time_cars}
                      label={m.bordersPage.msg6a2c5dc8ec}
                      caption={formatTemplate(m.borders.asOf, {
                        time: formatZonedDateTimeLabel(
                          new Date(),
                          locale,
                          "Europe/Sofia"
                        ),
                      })}
                    />
                    {border.data_source === "nakordoni" && (
                      <span className="text-xs font-medium text-[var(--waze-ok)]">{m.bordersPage.msg868089045f}</span>
                    )}
                    {border.data_source === "hatarinfo" && (
                      <span className="text-xs font-medium text-[var(--waze-text-secondary)]">{m.waitSource.hatarinfo}</span>
                    )}
                  </div>
                </div>

                <BorderAlternatives
                  border={border}
                  allBorders={borderStatus ?? []}
                />

                <div className="mt-4 grid grid-cols-1 gap-4">
                  <BorderStatsChart
                    hourlyData={border.avg_wait_by_hour}
                    title={formatTemplate(m.bordersPage.borderWaitChartTitle, {
                      name: borderDisplayName(locale, {
                        crossing_id: border.crossing_id,
                        name_bg: border.name_bg,
                        name_en: border.name_en,
                        name_i18n: border.name_i18n,
                      }),
                    })}
                  />
                  <BorderWebcam
                    crossingId={border.crossing_id}
                    label={borderDisplayName(locale, {
                      crossing_id: border.crossing_id,
                      name_bg: border.name_bg,
                      name_en: border.name_en,
                      name_i18n: border.name_i18n,
                    })}
                    nakordoniUrl={border.nakordoni_url}
                  />
                </div>
              </WazeCard>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--waze-text-muted)]">
          {m.bordersPage.queueDataPrefix}{" "}
          <a
            href="https://nakordoni.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--waze-accent-text)]"
          >{m.bordersPage.msg21d3a6bde4}</a>
          {" · "}
          <a
            href="https://www.windy.com/webcams"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--waze-accent-text)]"
          >{m.bordersPage.msg19f0cb96d3}</a>
        </p>
      </div>
    </div>
  );
}
