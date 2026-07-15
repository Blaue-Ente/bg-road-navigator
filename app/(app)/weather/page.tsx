"use client";

import { useEffect, useState } from "react";
import { useRouteStore } from "@/lib/stores/route.store";
import { useWeather } from "@/lib/hooks/useWeather";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { WeatherAlertBanner } from "@/components/weather/WeatherAlertBanner";
import { RouteWeatherTimeline } from "@/components/weather/RouteWeatherTimeline";

const MOUNTAIN_PASSES = [
  { name: "Шипченски проход", coords: { lng: 25.1, lat: 42.1 } },
  { name: "Предела", coords: { lng: 23.9, lat: 42.3 } },
  { name: "Петрохан", coords: { lng: 26.5, lat: 42.5 } },
  { name: "Троянски проход", coords: { lng: 25.4, lat: 42.7 } },
];

export default function WeatherPage() {
  const routeStore = useRouteStore();
  const { activeRoute } = routeStore;
  const [routePoints, setRoutePoints] = useState<Array<{ lng: number; lat: number }>>([]);
  const [weatherData, setWeatherData] = useState<{ points: any[], alerts: any[] }>({ points: [], alerts: [] });

  useEffect(() => {
    if (activeRoute) {
      // Sample points every ~50km along route
      const points: Array<{ lng: number; lat: number }> = [];
      
      // Add origin, destination, and midpoints
      points.push(activeRoute.origin.coords);
      
      if (activeRoute.waypoints.length > 0) {
        activeRoute.waypoints.forEach(wp => points.push(wp.coords));
      }
      
      points.push(activeRoute.destination.coords);
      
      // Add mountain passes if route crosses them (simplified check)
      points.push(...MOUNTAIN_PASSES.map(p => p.coords));
      
      const unique = Array.from(
        new Set(points.map((p) => `${p.lng},${p.lat}`))
      ).map((s) => {
        const [lng, lat] = s.split(",").map(Number);
        return { lng, lat };
      });

      setRoutePoints(unique);
    }
  }, [activeRoute]);

  const { data, isLoading, error } = useWeather(routePoints);

  useEffect(() => {
    if (data) {
      setWeatherData(data);
    }
  }, [data]);

  if (!activeRoute) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Време по маршрут</h1>
        <div className="text-center text-gray-400 py-8">
          Моля изберете маршрут от страницата "Маршрут", за да видите прогноза.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Време по маршрут</h1>
        <div className="text-center text-blue-400">Зареждане...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-blue-400">Време по маршрут</h1>
        <div className="text-center text-red-400">Грешка при зареждане на прогнозата.</div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 text-blue-400">Време по маршрут</h1>

      {/* Weather Alerts for mountain passes */}
      <WeatherAlertBanner alerts={weatherData.alerts} />

      {/* Timeline */}
      <RouteWeatherTimeline 
        weatherPoints={weatherData.points}
        departureTime={new Date()}
      />

      {/* Individual weather cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {weatherData.points.map((point, idx) => (
          <WeatherCard 
            key={idx} 
            weather={point} 
            distance={idx * 50}
          />
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-gray-500">
        Прогноза от{" "}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300"
        >
          Open-Meteo
        </a>{" "}
        (CC BY 4.0) — безплатна open-source услуга
      </p>
    </div>
  );
}