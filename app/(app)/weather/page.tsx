"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouteStore } from "@/lib/stores/route.store";
import { useWeather } from "@/lib/hooks/useWeather";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { WeatherAlertBanner } from "@/components/weather/WeatherAlertBanner";
import { RouteWeatherTimeline } from "@/components/weather/RouteWeatherTimeline";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";

const MOUNTAIN_PASSES = [
  { name: "Шипченски проход", coords: { lng: 25.1, lat: 42.1 } },
  { name: "Предела", coords: { lng: 23.9, lat: 42.3 } },
  { name: "Петрохан", coords: { lng: 26.5, lat: 42.5 } },
  { name: "Троянски проход", coords: { lng: 25.4, lat: 42.7 } },
];

export default function WeatherPage() {
  const { activeRoute } = useRouteStore();
  const [routePoints, setRoutePoints] = useState<Array<{ lng: number; lat: number }>>([]);
  const [weatherData, setWeatherData] = useState<{
    points: Parameters<typeof WeatherCard>[0]["weather"][];
    alerts: Parameters<typeof WeatherAlertBanner>[0]["alerts"];
  }>({ points: [], alerts: [] });

  useEffect(() => {
    if (activeRoute) {
      const points: Array<{ lng: number; lat: number }> = [];
      points.push(activeRoute.origin.coords);
      activeRoute.waypoints.forEach((wp) => points.push(wp.coords));
      points.push(activeRoute.destination.coords);
      points.push(...MOUNTAIN_PASSES.map((p) => p.coords));

      const unique = Array.from(new Set(points.map((p) => `${p.lng},${p.lat}`))).map(
        (s) => {
          const [lng, lat] = s.split(",").map(Number);
          return { lng, lat };
        }
      );
      setRoutePoints(unique);
    }
  }, [activeRoute]);

  const { data, isLoading, error } = useWeather(routePoints);

  useEffect(() => {
    if (data) setWeatherData(data);
  }, [data]);

  if (!activeRoute) {
    return (
      <div className="waze-page">
        <div className="mx-auto max-w-2xl text-center">
          <PageHeader
            title="Време по маршрут"
            subtitle="Прогноза по точките на вашето пътуване"
          />
          <WazeCard className="py-8">
            <p className="text-[var(--waze-text-secondary)]">
              Изберете маршрут, за да видите прогнозата.
            </p>
            <Link href="/route" className="waze-btn-primary mt-4 inline-block px-6 py-2.5 text-sm">
              Планирай маршрут
            </Link>
          </WazeCard>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--waze-accent)]">
        Зареждане на прогнозата...
      </div>
    );
  }

  if (error) {
    return (
      <div className="waze-page text-center text-red-400">
        Грешка при зареждане на прогнозата.
      </div>
    );
  }

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Време по маршрут"
          subtitle={`${activeRoute.origin.label} → ${activeRoute.destination.label}`}
        />

        <WeatherAlertBanner alerts={weatherData.alerts} />

        <RouteWeatherTimeline
          weatherPoints={weatherData.points}
          departureTime={new Date()}
        />

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {weatherData.points.map((point, idx) => (
            <WeatherCard key={idx} weather={point} distance={idx * 50} />
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
