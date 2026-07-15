"use client";

import { useFuelStations } from "@/lib/hooks/useFuelStations";
import { FuelStationCard } from "@/components/fuel/FuelStationCard";
import { EVChargerCard } from "@/components/fuel/EVChargerCard";

const DEFAULT_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export default function FuelPage() {
  const { data, isLoading, isError } = useFuelStations(DEFAULT_BBOX);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-blue-400">
        Зареждане...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center text-red-400 p-8">
        Не може да се заредят данните за гориво и зарядка.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-blue-400">
          Гориво и зарядка
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Бензиностанции и EV зарядни точки по маршрута до България
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xl font-medium text-blue-400">
              Бензиностанции
            </h2>
            <div className="space-y-4">
              {data.fuelStations.map((station) => (
                <FuelStationCard key={station.id} station={station} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-medium text-blue-400">
              EV зарядни станции
            </h2>
            <div className="space-y-4">
              {data.evStations.length === 0 ? (
                <p className="text-gray-400">Няма налични EV станции в района.</p>
              ) : (
                data.evStations.map((station) => (
                  <EVChargerCard key={station.id} station={station} />
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
