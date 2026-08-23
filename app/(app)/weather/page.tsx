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
import { haversineKm } from "@/lib/utils/route-planner";
import type { GeoPoint, Route } from "@/types/route.types";

const MOUNTAIN_PASSES = [
  { name: "Шипченски проход", coords: { lng: 25.1, lat: 42.1 } },
  { name: "Предела", coords: { lng: 23.9, lat: 42.3 } },
  { name: "Петрохан", coords: { lng: 23.15, lat: 43.12 } },
  { name: "Троянски проход", coords: { lng: 24.65, lat: 42.78 } },
];

const PASS_NEAR_ROUTE_KM = 70;

function mountainPassesOnRoute(route: Route) {
  return MOUNTAIN_PASSES.filter((pass) =>
    route.geometry.coordinates.some(([lng, lat]) =>
      haversineKm({ lng, lat }, pass.coords) <= PASS_NEAR_ROUTE_KM
    )
  );
}

function weatherPointsForRoute(route: Route): GeoPoint[] {
  const points = [
    route.origin.coords,
    ...route.waypoints.map((wp) => wp.coords),
    route.destination.coords,
    ...mountainPassesOnRoute(route).map((p) => p.coords),
  ];
  const seen = new Set<string>();
  return points.filter((point) => {
    const key = `${point.lng},${point.lat}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function WeatherPage() {
  const { activeRoute } = useRouteStore();
  const routePoints = useMemo(
    () => (activeRoute ? weatherPointsForRoute(activeRoute) : []),
    [activeRoute]
  );
  const { data, isLoading, error } = useWeather(routePoints);

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
              Път към вкъщи
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

  const weatherPoints = data?.points ?? [];
  const alerts = data?.alerts ?? [];

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Време по маршрут"
          subtitle={`${activeRoute.origin.label} → ${activeRoute.destination.label}`}
        />

        <WeatherAlertBanner alerts={alerts} />

        <RouteWeatherTimeline
          weatherPoints={weatherPoints}
          departureTime={new Date()}
        />

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {weatherPoints.map((point, idx) => (
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
