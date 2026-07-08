import type { WeatherPoint } from "@/types/weather.types";

interface WeatherCardProps {
  weather: WeatherPoint;
  distance?: number; // km from route
}

export function WeatherCard({ weather, distance }: WeatherCardProps) {
  const getConditionColor = (condition: string) => {
    const cond = condition.toLowerCase();
    if (cond.includes("ясно")) return "text-yellow-300";
    if (cond.includes("малкооблачно")) return "text-yellow-400";
    if (cond.includes("облачно")) return "text-gray-400";
    if (cond.includes("дъжд")) return "text-blue-300";
    if (cond.includes("снег")) return "text-blue-200";
    return "text-white";
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-center gap-3">
        {distance && (
          <div className="text-xs text-gray-400">{distance.toFixed(0)} км</div>
        )}
        <div className="text-3xl">{weather.icon}</div>
        <div>
          <div className="text-2xl">{weather.temperature_c}°C</div>
          <div className={`text-sm ${getConditionColor(weather.condition)}`}>
            {weather.condition}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-gray-400">
        <div>
          <span className="opacity-70">Вятър</span>
          <div>{weather.wind_kmh} км/ч</div>
        </div>
        <div>
          <span className="opacity-70">Дъжд</span>
          <div>{weather.precipitation_mm} мм</div>
        </div>
        <div>
          <span className="opacity-70">Видимост</span>
          <div>{weather.visibility_km} км</div>
        </div>
      </div>
    </div>
  );
}