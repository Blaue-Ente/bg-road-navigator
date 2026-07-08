import { useQuery } from "@tanstack/react-query";
import type { WeatherPoint, WeatherAlert } from "@/types/weather.types";

export function useWeather(points: Array<{ lng: number; lat: number }> = [], departureTime?: Date) {
  return useQuery({
    queryKey: ["weather", points, departureTime],
    queryFn: async (): Promise<{ points: WeatherPoint[]; alerts: WeatherAlert[] }> => {
      if (points.length === 0) {
        return { points: [], alerts: [] };
      }

      // In real app, this would call /api/weather
      const pointParam = encodeURIComponent(JSON.stringify(points));
      const timeParam = departureTime?.toISOString() ?? new Date().toISOString();
      
      const response = await fetch(`/api/weather?points=${pointParam}&departure_time=${timeParam}`);
      
      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}`);
      }
      
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 30,
    enabled: points.length > 0,
  });
}