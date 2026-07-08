"use client";

import { useQuery } from "@tanstack/react-query";
import { Coordinates } from "@/types/map.types";

interface FuelPageProps {
  mapLocation?: Coordinates;
  zoom?: number;
}

export function FuelPage({ mapLocation, zoom = 10 }: FuelPageProps) {
  // Mock bbox for Thrace/Eastern Bulgaria where most stations are
  const mockBbox = { w: 27.0, s: 41.5, e: 28.5, n: 43.5 };

  const { data: stations, isLoading, isError } = useFuelStations(mockBbox as any);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center">
        Зареждане...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-400 p-8">
        Не може да се заредят данните за гориво/зарядка.
      </div>
    </div>
  }

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-400">Гориво и зарядка</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fuel Stations */}
          <div>
            <h2 className="text-xl font-medium mb-4 text-blue-400">Ходилни станции</h2>
            <div className="space-y-4">
              {stations && 
                stations.map((station) => {
                  if (station.brand) {
                    return <FuelStationCard key={station.id} station={station} />;
                  }
                  return null;
                })}
            </div>
          </div>
          
          {/* EV Chargers */}
          <div>
            <h2 className="text-xl font-medium mb-4 text-blue-400">Електроточкови станции</h2>
            <div className="space-y-4">
              {stations && 
                stations.filter((s) => s.operator && s.operator.toLowerCase().includes('charge')).map((evStation) => (
                  <EVChargerCard 
                    key={evStation.id} 
                    station={evStation} 
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}