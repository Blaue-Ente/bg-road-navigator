"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { BorderCard } from "@/components/borders/BorderCard";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { BorderWebcam } from "@/components/borders/BorderWebcam";
import { BorderStatsChart } from "@/components/borders/BorderStatsChart";
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
        <div className="flex h-screen items-center justify-center text-blue-400">
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

  const { data: borderStatus, isLoading, error } = useBorderStatus(fetchOptions);

  const displayedBorders = useMemo(() => {
    if (!borderStatus) return [];
    if (activeTab === "europe") {
      return borderStatus.filter((b) => b.region !== "bulgaria");
    }
    return borderStatus;
  }, [borderStatus, activeTab]);

  if (isLoading && fetchOptions.enabled !== false) {
    return (
      <div className="flex h-screen items-center justify-center text-blue-400">
        Зареждане на граници...
      </div>
    );
  }

  if (error || !borderStatus) {
    return (
      <div className="p-8 text-center text-red-400">
        Не може да се заредят данните за границите.
        <button
          onClick={() => window.location.reload()}
          className="mt-4 block text-blue-400 hover:text-blue-300"
        >
          Опитай отново
        </button>
      </div>
    );
  }

  const hasLiveData = displayedBorders.some((b) => b.data_source === "nakordoni");

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <h1 className="mb-2 text-2xl font-bold text-blue-400">
        Гранични пролази
      </h1>
      <p className="mb-4 text-sm text-gray-400">
        Граници в цяла Европа — България, транзитни пунктове и коридори за
        дълги пътувания
      </p>

      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "route" && !borderIds?.length && (
        <p className="mb-4 rounded-lg border border-amber-800/50 bg-amber-900/20 p-3 text-sm text-amber-200">
          Изберете маршрут от секция Маршрут, за да видите границите по пътя.
        </p>
      )}

      <p className="mb-6 text-xs text-gray-500">
        {hasLiveData
          ? "Реални опашки от nakordoni.eu · камери от Windy или Nakordoni"
          : "Оценка по исторически данни · добавете NAKORDONI_API_KEY за live опашки"}
      </p>

      <div className="grid gap-4">
        {displayedBorders.length === 0 ? (
          <p className="text-center text-gray-500">Няма граници за показване.</p>
        ) : (
          displayedBorders.map((border) => (
            <div
              key={border.crossing_id}
              className="rounded-lg border border-gray-800 bg-gray-900 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <BorderCard border={border} />
                <div className="flex flex-col items-end gap-1">
                  <BorderWaitBadge
                    waitMinutes={border.wait_time_cars}
                    label="Коли"
                  />
                  {border.data_source === "nakordoni" && (
                    <span className="text-[10px] text-green-400">● live</span>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
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
            </div>
          ))
        )}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        Данни за опашки:{" "}
        <a
          href="https://nakordoni.eu/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          nakordoni.eu
        </a>
        {" · "}
        Камери:{" "}
        <a
          href="https://www.windy.com/webcams"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          Windy Webcams
        </a>
      </p>
    </div>
  );
}
