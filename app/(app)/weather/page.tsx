"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";

import { useMemo } from "react";
import Link from "next/link";
import { useRouteStore } from "@/lib/stores/route.store";
import { useWeather } from "@/lib/hooks/useWeather";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { WeatherAlertBanner } from "@/components/weather/WeatherAlertBanner";
import { RouteWeatherTimeline } from "@/components/weather/RouteWeatherTimeline";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { PageSkeleton, ErrorState } from "@/components/ui/PageSkeleton";
import { sampleWeatherPoints } from "@/lib/utils/route-weather-points";

export default function WeatherPage() {
  const m = useMessages();
  const locale = useLocale();
  const { activeRoute } = useRouteStore();
  const samples = useMemo(
    () => (activeRoute ? sampleWeatherPoints(activeRoute, 6, locale) : []),
    [activeRoute, locale]
  );
  const queryPoints = useMemo(
    () => samples.map((p) => ({ lng: p.lng, lat: p.lat })),
    [samples]
  );
  const { data, isLoading, error, refetch } = useWeather(queryPoints);

  const merged = useMemo(() => {
    if (!data?.points) return [];
    return data.points.map((point, index) => {
      const sample = samples[index];
      return {
        ...point,
        label: sample?.label,
        distance_from_origin_km: sample?.distance_from_origin_km,
        eta_min: sample?.eta_min,
      };
    });
  }, [data, samples]);

  if (!activeRoute) {
    return (
      <div className="waze-page">
        <div className="mx-auto max-w-2xl text-center">
          <PageHeader
            title={m.weatherPage.msg74a4274aa2}
            subtitle={m.weatherPage.msgc96f2c4ba8}
          />
          <WazeCard className="py-8">
            <p className="text-[var(--waze-text-secondary)]">{m.weatherPage.msg696d34d97f}</p>
            <Link
              href="/route"
              className="waze-btn-primary mt-4 inline-block px-6 py-2.5 text-sm"
            >{m.weatherPage.msg20e634be39}</Link>
          </WazeCard>
        </div>
      </div>
    );
  }

  if (isLoading) return <PageSkeleton label={m.weatherPage.msg98e1692afb} />;
  if (error) {
    return (
      <ErrorState
        message={m.weatherPage.msg91ee2475bb}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title={m.weatherPage.msg74a4274aa2}
          subtitle={`${activeRoute.origin.label} → ${activeRoute.destination.label}`}
        />
        <p className="mb-4 text-xs text-[var(--waze-text-muted)]">
          {m.weatherPage.openMeteo9763}
        </p>

        <WeatherAlertBanner alerts={data?.alerts ?? []} />

        <RouteWeatherTimeline weatherPoints={merged} />

        <div className="mt-6 grid grid-cols-1 gap-3">
          {merged.map((point, idx) => (
            <WeatherCard
              key={`${point.coords.lng}-${point.coords.lat}-${idx}`}
              weather={point}
              distance={point.distance_from_origin_km}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--waze-text-muted)]">
          {m.weatherPage.forecastFrom}{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--waze-accent-text)]"
          >
            Open-Meteo
          </a>{" "}
          (CC BY 4.0)
        </p>
      </div>
    </div>
  );
}
