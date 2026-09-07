"use client";

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
  const { activeRoute } = useRouteStore();
  const samples = useMemo(
    () => (activeRoute ? sampleWeatherPoints(activeRoute, 6) : []),
    [activeRoute]
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
            title="Време по маршрут"
            subtitle="Текущи условия в точки по активния маршрут"
          />
          <WazeCard className="py-8">
            <p className="text-[var(--waze-text-secondary)]">
              Изберете маршрут, за да видите прогнозата.
            </p>
            <Link
              href="/route"
              className="waze-btn-primary mt-4 inline-block px-6 py-2.5 text-sm"
            >
              Планирай маршрут
            </Link>
          </WazeCard>
        </div>
      </div>
    );
  }

  if (isLoading) return <PageSkeleton label="Зареждане на прогнозата" />;
  if (error) {
    return (
      <ErrorState
        message="Грешка при зареждане на прогнозата."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Време по маршрут"
          subtitle={`${activeRoute.origin.label} → ${activeRoute.destination.label}`}
        />
        <p className="mb-4 text-xs text-[var(--waze-text-muted)]">
          Текущи условия (Open-Meteo), не почасова прогноза за ETA. Часовете са
          оценка според разстоянието по маршрута.
        </p>

        <WeatherAlertBanner alerts={data?.alerts ?? []} />

        <RouteWeatherTimeline weatherPoints={merged} />

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {merged.map((point, idx) => (
            <WeatherCard
              key={`${point.coords.lng}-${point.coords.lat}-${idx}`}
              weather={point}
              distance={point.distance_from_origin_km}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--waze-text-muted)]">
          Прогноза от{" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--waze-accent)]"
          >
            Open-Meteo
          </a>{" "}
          (CC BY 4.0)
        </p>
      </div>
    </div>
  );
}
