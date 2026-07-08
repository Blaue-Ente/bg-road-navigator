import type { WeatherAlert } from "@/types/weather.types";

interface WeatherAlertBannerProps {
  alerts: WeatherAlert[];
}

export function WeatherAlertBanner({ alerts }: WeatherAlertBannerProps) {
  if (!alerts || alerts.length === 0) return null;

  const getSeverityStyles = (severity: "moderate" | "severe" | "extreme") => {
    switch (severity) {
      case "moderate":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-300";
      case "severe":
        return "bg-orange-500/20 border-orange-500 text-orange-300";
      case "extreme":
        return "bg-red-500/20 border-red-500 text-red-300";
    }
  };

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((alert, idx) => (
        <div 
          key={idx} 
          className={`border rounded-lg p-3 ${getSeverityStyles(alert.severity)}`}
        >
          <div className="flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <div>
              <div className="font-semibold">{alert.title}</div>
              <div className="text-sm opacity-90">{alert.description}</div>
              <div className="text-xs opacity-70 mt-1">
                Изтича: {new Date(alert.expires_at).toLocaleString("bg-BG")}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}