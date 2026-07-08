"use client";

import { useEffect, useState } from "react";
import { WeatherCard } from "./WeatherCard";
import type { WeatherPoint } from "@/types/weather.types";

interface RouteWeatherTimelineProps {
  weatherPoints: WeatherPoint[];
  departureTime: Date;
}

export function RouteWeatherTimeline({ weatherPoints, departureTime }: RouteWeatherTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!weatherPoints || weatherPoints.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        Няма прогноза за времето за този маршрут.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-medium text-blue-400">Прогноза време по маршрута</h2>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {weatherPoints.map((point, idx) => {
          const arrivalTime = new Date(departureTime.getTime() + idx * 30 * 60000); // 30min per segment
          
          return (
            <div key={idx} className="min-w-[140px] flex-shrink-0">
              <div className="text-xs text-gray-400 mb-1">
                {arrivalTime.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <WeatherCard weather={point} />
            </div>
          );
        })}
      </div>
    </div>
  );
}