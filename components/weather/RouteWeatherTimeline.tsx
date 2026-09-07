"use client";

import { WeatherCard } from "./WeatherCard";
import type { WeatherPoint } from "@/types/weather.types";

interface RouteWeatherTimelineProps {
  weatherPoints: WeatherPoint[];
}

export function RouteWeatherTimeline({
  weatherPoints,
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
        Точки по маршрута
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {weatherPoints.map((point, idx) => {
          const eta =
            typeof point.eta_min === "number"
              ? `+${Math.floor(point.eta_min / 60)}ч ${point.eta_min % 60}м`
              : (point.label ?? "точка");

          return (
            <div key={idx} className="min-w-[150px] shrink-0">
              <div className="mb-1 text-xs font-medium text-[var(--waze-text-muted)]">
                {eta}
                {typeof point.distance_from_origin_km === "number"
                  ? ` · ${point.distance_from_origin_km} км`
                  : ""}
              </div>
              <WeatherCard weather={point} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
