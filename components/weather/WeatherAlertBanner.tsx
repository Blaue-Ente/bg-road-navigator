import type { WeatherAlert } from "@/types/weather.types";

interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
}

export function WeatherAlertBanner({ alerts }: WeatherAlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  const getSeverityStyles = (severity: WeatherAlert["severity"]) => {
    switch (severity) {
      case "low":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-300";
      case "medium":
        return "bg-orange-500/20 border-orange-500 text-orange-300";
      case "high":
        return "bg-red-500/20 border-red-500 text-red-300";
    }
  };

  return (
    <div className="mb-4 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-lg border p-3 ${getSeverityStyles(alert.severity)}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="font-semibold">{alert.title}</div>
              <div className="text-sm opacity-90">{alert.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
