"use client";

import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { BorderCard } from "@/components/borders/BorderCard";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { BorderWebcam } from "@/components/borders/BorderWebcam";
import { BorderStatsChart } from "@/components/borders/BorderStatsChart";

export default function BorderPage() {
  const { data: borderStatus, isLoading, error } = useBorderStatus();

  if (isLoading) {
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

  const hasLiveData = borderStatus.some((b) => b.data_source === "nakordoni");

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <h1 className="mb-2 text-2xl font-bold text-blue-400">Гранични пролази</h1>
      <p className="mb-6 text-sm text-gray-400">
        {hasLiveData
          ? "Реални опашки от nakordoni.eu · камери от Windy или Nakordoni"
          : "Оценка по исторически данни · добавете NAKORDONI_API_KEY за live опашки"}
      </p>

      <div className="grid gap-4">
        {borderStatus.map((border) => (
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
        ))}
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
