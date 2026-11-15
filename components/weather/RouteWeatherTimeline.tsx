"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";
import { formatTemplate } from "@/lib/i18n/format-template";

import { WeatherCard } from "./WeatherCard";
import type { WeatherPoint } from "@/types/weather.types";

interface RouteWeatherTimelineProps {
  weatherPoints: WeatherPoint[];
}

export function RouteWeatherTimeline({
  weatherPoints,
}: RouteWeatherTimelineProps) {
  const m = useMessages();
  if (!weatherPoints || weatherPoints.length === 0) {
    return (
      <div className="py-8 text-center text-[var(--waze-text-muted)]">{m.weather.msgfa14ae0b48}</div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">{m.weather.msg3c6bd1f887}</h2>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {weatherPoints.map((point, idx) => {
          const eta =
            typeof point.eta_min === "number"
              ? formatTemplate(m.weather.etaFromStart, {
                  hours: Math.floor(point.eta_min / 60),
                  minutes: point.eta_min % 60,
                })
              : (point.label ?? m.weather.msg09ccbaca32);

          return (
            <div key={idx} className="min-w-[150px] shrink-0">
              <div className="mb-1 text-xs font-medium text-[var(--waze-text-muted)]">
                {eta}
                {typeof point.distance_from_origin_km === "number"
                  ? formatTemplate(m.weather.kmFromOrigin, {
                      km: point.distance_from_origin_km,
                    })
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
