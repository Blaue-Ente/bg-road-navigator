import type { WeatherAlert } from "@/types/weather.types";

interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
}

export function WeatherAlertBanner({ alerts }: WeatherAlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  const getSeverityStyles = (severity: WeatherAlert["severity"]) => {
    switch (severity) {
      case "low":
        return "border-yellow-500/40 bg-yellow-500/10 text-yellow-200";
      case "medium":
        return "border-orange-500/40 bg-orange-500/10 text-orange-200";
      case "high":
        return "border-red-500/40 bg-red-500/10 text-red-200";
    }
  };

  return (
    <div className="mb-4 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`rounded-2xl border p-3 ${getSeverityStyles(alert.severity)}`}
        >
          <div className="font-semibold">{alert.title}</div>
          <div className="mt-0.5 text-sm opacity-90">{alert.description}</div>
        </div>
      ))}
    </div>
  );
}
