"use client";

import { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { BorderCard } from "@/components/borders/BorderCard";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
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

const TABS: { id: TabId; label: string; region: EuropeanBorderRegion }[] = [
  { id: "bulgaria", label: "България", region: "bulgaria" },
  { id: "europe", label: "Европа", region: "all" },
  { id: "route", label: "По маршрута", region: "route" },
];

export default function BorderPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-16 text-center text-sm text-[var(--waze-text-secondary)]">
          Зареждане на граници...
        </div>
      }
    >
      <BorderPageContent />
    </Suspense>
  );
}

function BorderPageContent() {
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
      <div className="px-4 py-16 text-center text-sm text-[var(--waze-text-secondary)]">
        Зареждане на граници...
      </div>
    );
  }

  if (error || !borderStatus) {
    return (
      <div className="p-8 text-center text-sm text-[var(--waze-danger)]">
        Списъкът с пунктове не се зареди. Проверете връзката и опитайте отново.
        <button
          onClick={() => window.location.reload()}
          className="mt-4 block text-[var(--waze-accent-text)]"
        >
          Опитай отново
        </button>
      </div>
    );
  }

  const hasLiveData = displayedBorders.some(
    (b) => b.data_source === "nakordoni"
  );

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Гранични пролази"
          subtitle="България, Европа и граници по вашия маршрут"
        />

        <div className="mb-6 flex gap-2">
          {TABS.map((tab) => (
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
          <p className="mb-4 rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-3 text-sm text-[var(--waze-warning)]">
            Няма избран маршрут. Изчислете пътя, за да видите границите по него.
          </p>
        )}

        <p className="mb-6 text-xs text-[var(--waze-text-muted)]">
          {hasLiveData
            ? "Живи опашки от граничните камери и официалните източници"
            : "Няма жива опашка, показваме обичаен час."}
        </p>

        <WazeCard className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--waze-text)]">
            Винетки за преминаване
          </h2>
          <p className="mt-1 text-sm text-[var(--waze-text-secondary)]">
            Преди граница проверете официалните портали за електронни винетки и
            тол.
          </p>
          <Link
            href="/vignettes"
            className="mt-3 inline-flex text-sm font-medium text-[var(--waze-accent-text)] hover:underline"
          >
            Към пълния списък с винетки
          </Link>
        </WazeCard>

        <WazeCard className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--waze-text)]">
            Опашки от шофьори
          </h2>
          {borderQueues.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
              Няма пресен сигнал за опашка. Задръжте на картата и изберете
              „Опашка на граница“.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {borderQueues.slice(0, 6).map((pin) => {
                const crossing = nearestBgBorderPoint(pin.coords, 25);
                return (
                  <li key={pin.id} className="text-sm text-[var(--waze-text)]">
                    <span className="font-medium">
                      {crossing?.name_bg ?? communityPinLabel(pin.category)}
                    </span>
                    <span className="text-[var(--waze-text-secondary)]">
                      {" "}
                      · {formatPinAge(pin.created_at)}
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
            <p className="text-center text-sm text-[var(--waze-text-secondary)]">
              Няма пунктове за този избор. Сменете раздела или изчислете маршрут.
            </p>
          ) : (
            displayedBorders.map((border) => (
              <WazeCard key={border.crossing_id} className="!p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <BorderCard border={border} />
                  <div className="flex flex-col items-end gap-1">
                    <BorderWaitBadge
                      waitMinutes={border.wait_time_cars}
                      label="Коли"
                    />
                    {border.data_source === "nakordoni" && (
                      <span className="text-xs font-medium text-[var(--waze-ok)]">
                        на живо
                      </span>
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
                    title={`Средно изчакване — ${border.name_bg}`}
                  />
                  <BorderWebcam
                    crossingId={border.crossing_id}
                    label={border.name_bg}
                    nakordoniUrl={border.nakordoni_url}
                  />
                </div>
              </WazeCard>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--waze-text-muted)]">
          Данни за опашки:{" "}
          <a
            href="https://nakordoni.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--waze-accent-text)]"
          >
            гранични камери
          </a>
          {" · "}
          <a
            href="https://www.windy.com/webcams"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--waze-accent-text)]"
          >
            уеб камери
          </a>
        </p>
      </div>
    </div>
  );
}
