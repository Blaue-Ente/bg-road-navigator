"use client";

interface BorderStatsChartProps {
  hourlyData: number[];
  title?: string;
}

export function BorderStatsChart({
  hourlyData,
  title = "Средно изчакване по часове",
}: BorderStatsChartProps) {
  const maxWait = Math.max(...hourlyData, 1);
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
      <h4 className="mb-1 text-sm font-medium">{title}</h4>
      <p className="mb-3 text-xs text-gray-400">
        Пик около {peakHour}:00 — {Math.round(hourlyData[peakHour])} мин
      </p>
      <div className="flex h-24 items-end gap-0.5">
        {hourlyData.map((wait, hour) => {
          const height = Math.max((wait / maxWait) * 100, 4);
          const isPeak = hour === peakHour;
          return (
            <div
              key={hour}
              className="group relative flex-1"
              title={`${hour}:00 — ${Math.round(wait)} мин`}
            >
              <div
                className={`w-full rounded-t transition-colors ${
                  isPeak ? "bg-blue-500" : "bg-blue-600/60 group-hover:bg-blue-500"
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-gray-500">
        <span>0:00</span>
        <span>12:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
