"use client";

import { WeatherCard } from "./WeatherCard";
import type { WeatherPoint } from "@/types/weather.types";

interface RouteWeatherTimelineProps {
  weatherPoints: WeatherPoint[];
  departureTime: Date;
}

export function RouteWeatherTimeline({
  weatherPoints,
  departureTime,
}: RouteWeatherTimelineProps) {
  if (!weatherPoints || weatherPoints.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--waze-text-muted)]">
        Няма прогноза за този маршрут.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
        Хронология по маршрута
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {weatherPoints.map((point, idx) => {
          const arrivalTime = new Date(
            departureTime.getTime() + idx * 30 * 60000
          );

          return (
            <div key={idx} className="min-w-[150px] shrink-0">
              <div className="mb-1 text-xs font-medium text-[var(--waze-text-muted)]">
                {arrivalTime.toLocaleTimeString("bg-BG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <WeatherCard weather={point} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
