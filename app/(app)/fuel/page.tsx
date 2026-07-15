"use client";

import { useFuelStations } from "@/lib/hooks/useFuelStations";
import { FuelStationCard } from "@/components/fuel/FuelStationCard";
import { EVChargerCard } from "@/components/fuel/EVChargerCard";
import { PageHeader } from "@/components/ui/PageHeader";

const DEFAULT_BBOX = { w: 22.0, s: 41.0, e: 29.0, n: 44.5 };

export default function FuelPage() {
  const { data, isLoading, isError } = useFuelStations(DEFAULT_BBOX);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--waze-accent)]">
        Зареждане...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="waze-page text-center text-red-400">
        Не може да се заредят данните за гориво и зарядка.
      </div>
    );
  }

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title="Гориво и зарядка"
          subtitle="Бензиностанции и EV точки по маршрута в Европа"
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
              Бензиностанции
            </h2>
            <div className="space-y-3">
              {data.fuelStations.map((station) => (
                <FuelStationCard key={station.id} station={station} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
              EV зарядни
            </h2>
            <div className="space-y-3">
              {data.evStations.length === 0 ? (
                <p className="text-[var(--waze-text-muted)]">
                  Няма EV станции в района.
                </p>
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
