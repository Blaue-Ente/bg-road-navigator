"use client";

import { useBorderStatus } from "@/lib/hooks/useBorderStatus";
import { BorderCard } from "@/components/borders/BorderCard";
import { BorderWaitBadge } from "@/components/borders/BorderWaitBadge";
import { BorderWebcam } from "@/components/borders/BorderWebcam";
import { BorderStatsChart } from "@/components/borders/BorderStatsChart";

export default function BorderPage() {
  const { data: borderStatus, isLoading, error } = useBorderStatus();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-blue-400">
        Зареждане на граници...
      </div>
    );
  }

  if (error || !borderStatus) {
    return (
      <div className="text-center text-red-400 p-8">
        Не може да се загрузят данните за границите.
        <button 
          onClick={() => window.location.reload()}
          className="block mt-4 text-blue-400 hover:text-blue-300"
        >
          Опитай отново
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-6 text-blue-400">Гранични пролази</h1>
      
      <div className="grid gap-4">
        {borderStatus.map((border) => (
          <div 
            key={border.crossing_id} 
            className="bg-gray-900 rounded-lg p-4 border border-gray-800"
          >
            <div className="flex justify-between items-start mb-3">
              <BorderCard border={border} />
              <BorderWaitBadge 
                waitMinutes={border.wait_time_cars} 
                label="Камиони" 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <BorderStatsChart 
                hourlyData={border.avg_wait_by_hour} 
                title={`Средно изчакване - ${border.name_bg}`}
              />
              <BorderWebcam 
                url={border.webcam_urls?.[0] || "/placeholder-webcam.png"} 
                label={border.name_bg}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}