import type { WeatherPoint } from "@/types/weather.types";

interface WeatherCardProps {
  weather: WeatherPoint;
  distance?: number;
}

export function WeatherCard({ weather, distance }: WeatherCardProps) {
  return (
    <div className="waze-panel p-4">
      <div className="flex items-center gap-3">
        {distance !== undefined && (
          <div className="text-xs font-medium text-[var(--waze-text-muted)]">
            {distance.toFixed(0)} км
          </div>
        )}
        <div className="text-3xl">{weather.icon}</div>
        <div>
          <div className="text-2xl font-bold text-[var(--waze-text)]">
            {weather.temperature_c}°C
          </div>
          <div className="text-sm text-[var(--waze-text-secondary)]">
            {weather.condition}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-[var(--waze-text-muted)]">
        <div>
          <span className="block opacity-70">Вятър</span>
          <span className="font-medium text-[var(--waze-text-secondary)]">
            {weather.wind_kmh} км/ч
          </span>
        </div>
        <div>
          <span className="block opacity-70">Дъжд</span>
          <span className="font-medium text-[var(--waze-text-secondary)]">
            {weather.precipitation_mm} мм
          </span>
        </div>
        <div>
          <span className="block opacity-70">Видимост</span>
          <span className="font-medium text-[var(--waze-text-secondary)]">
            {weather.visibility_km} км
          </span>
        </div>
      </div>
    </div>
  );
}
