"use client";

import { MapPin } from "lucide-react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { WeatherGlyphIcon } from "@/components/weather/WeatherGlyph";
import { formatPlanInstant } from "@/lib/planner/plan-time";
import type { TripPlannerResult } from "@/lib/planner/types";
import { wmoToWeather } from "@/lib/utils/weather-codes";

/**
 * The forecast where the trip plan expects the driver to be, at the time the
 * plan expects it: place, clock time (stops and overnight rests included),
 * and distance from the start.
 */
export function PlanWeatherCards({ plan }: { plan: TripPlannerResult }) {
  const m = useMessages();
  const locale = useLocale();
  return (
    <>
      {plan.weather.warnings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {plan.weather.warnings.map((warning) => (
            <li
              key={`${warning.source}-${warning.title}`}
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--waze-warning)]"
            >
              <p className="font-medium">{warning.title}</p>
              <p>{warning.detail}</p>
            </li>
          ))}
        </ul>
      )}
      <ul className="mt-6 grid grid-cols-1 gap-3">
        {plan.weather.segments.map((segment) => {
          const glyph =
            segment.weather_code == null
              ? "unknown"
              : wmoToWeather(segment.weather_code).icon;
          return (
            <li
              key={`${segment.eta}-${segment.distance_from_start_km}`}
              className="waze-panel p-4"
            >
              <p className="flex items-center gap-1 text-sm font-semibold text-[var(--waze-text)]">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                {segment.place ??
                  `${segment.distance_from_start_km} ${m.units.km}`}
              </p>
              <p className="mt-0.5 text-xs text-[var(--waze-text-muted)]">
                {formatPlanInstant(
                  segment.eta,
                  locale,
                  plan.route.destination.time_zone
                )}
                {" · "}
                {segment.distance_from_start_km} {m.units.km}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <WeatherGlyphIcon
                  name={glyph}
                  className="h-8 w-8 text-[var(--waze-accent-text)]"
                />
                <div>
                  <div className="text-2xl font-bold text-[var(--waze-text)]">
                    {segment.temperature_c != null
                      ? `${Math.round(segment.temperature_c)}°C`
                      : "—"}
                  </div>
                  <div className="text-sm text-[var(--waze-text-secondary)]">
                    {segment.summary_bg}
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--waze-text-muted)]">
                <div>
                  <span className="block opacity-70">
                    {m.weatherLabels.wind}
                  </span>
                  <span className="font-medium text-[var(--waze-text-secondary)]">
                    {segment.wind_kmh != null
                      ? Math.round(segment.wind_kmh)
                      : "—"}{" "}
                    {m.units.kmSlashH}
                  </span>
                </div>
                <div>
                  <span className="block opacity-70">
                    {m.weatherLabels.rain}
                  </span>
                  <span className="font-medium text-[var(--waze-text-secondary)]">
                    {segment.precipitation_mm ?? "—"} {m.units.mm}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
