"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EUROPEAN_CITIES,
  REGION_LABELS,
  type EuropeanRegion,
} from "@/lib/constants/european-cities";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";
import { useRouteStore } from "@/lib/stores/route.store";
import {
  buildCorridorRoute,
  calculateRouteFromLabels,
  estimateRestStops,
  formatDuration,
  isLongHaul,
} from "@/lib/utils/route-planner";

const REGIONS = Object.keys(REGION_LABELS) as EuropeanRegion[];

export default function RoutePage() {
  const { activeRoute, setActiveRoute, clearRoute } = useRouteStore();
  const [originLabel, setOriginLabel] = useState(
    activeRoute?.origin.label ?? "Лондон"
  );
  const [destLabel, setDestLabel] = useState(
    activeRoute?.destination.label ?? "София"
  );
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [routeBorders, setRouteBorders] = useState<string[]>([]);

  const handleCorridorSelect = (corridorId: string) => {
    const corridor = TRAVEL_CORRIDORS.find((c) => c.id === corridorId);
    if (!corridor) return;

    setSelectedCorridor(corridorId);
    const first = EUROPEAN_CITIES.find((c) => c.id === corridor.cityIds[0]);
    const last = EUROPEAN_CITIES.find(
      (c) => c.id === corridor.cityIds[corridor.cityIds.length - 1]
    );
    if (first) setOriginLabel(first.label);
    if (last) setDestLabel(last.label);
    setRouteBorders(corridor.borderIds);
  };

  const handleCalculate = () => {
    setCalculating(true);
    setSelectedCorridor(null);
    setRouteBorders([]);

    const route =
      selectedCorridor
        ? buildCorridorRoute(selectedCorridor)
        : calculateRouteFromLabels(originLabel, destLabel, EUROPEAN_CITIES);

    if (!route) {
      setCalculating(false);
      return;
    }

    setTimeout(() => {
      setActiveRoute(route);
      setCalculating(false);
    }, 400);
  };

  const handleCorridorCalculate = (corridorId: string) => {
    setCalculating(true);
    const corridor = TRAVEL_CORRIDORS.find((c) => c.id === corridorId);
    const route = buildCorridorRoute(corridorId);

    if (corridor) {
      setSelectedCorridor(corridorId);
      setRouteBorders(corridor.borderIds);
      const first = EUROPEAN_CITIES.find((c) => c.id === corridor.cityIds[0]);
      const last = EUROPEAN_CITIES.find(
        (c) => c.id === corridor.cityIds[corridor.cityIds.length - 1]
      );
      if (first) setOriginLabel(first.label);
      if (last) setDestLabel(last.label);
    }

    setTimeout(() => {
      if (route) setActiveRoute(route);
      setCalculating(false);
    }, 400);
  };

  const longHaul = activeRoute ? isLongHaul(activeRoute.duration_min) : false;
  const restStops = activeRoute
    ? estimateRestStops(activeRoute.duration_min)
    : 0;

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-blue-400">
          Планиране на маршрут
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Маршрути из цяла Европа за български пътуващи — включително
          дълги пътувания над 30 часа
        </p>

        <section className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-gray-300">
            Популярни коридори
          </h2>
          <div className="flex flex-wrap gap-2">
            {TRAVEL_CORRIDORS.map((corridor) => (
              <button
                key={corridor.id}
                onClick={() => handleCorridorSelect(corridor.id)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  selectedCorridor === corridor.id
                    ? "border-blue-500 bg-blue-600/30 text-blue-300"
                    : "border-gray-700 bg-gray-900 text-gray-300 hover:border-gray-600"
                }`}
              >
                {corridor.label} · ~{corridor.estimatedHours}ч
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Откъде</label>
            <select
              value={originLabel}
              onChange={(e) => {
                setOriginLabel(e.target.value);
                setSelectedCorridor(null);
              }}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2"
            >
              {REGIONS.map((region) => (
                <optgroup key={region} label={REGION_LABELS[region]}>
                  {EUROPEAN_CITIES.filter((c) => c.region === region).map(
                    (city) => (
                      <option key={city.id} value={city.label}>
                        {city.label}, {city.country}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Накъде</label>
            <select
              value={destLabel}
              onChange={(e) => {
                setDestLabel(e.target.value);
                setSelectedCorridor(null);
              }}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2"
            >
              {REGIONS.map((region) => (
                <optgroup key={region} label={REGION_LABELS[region]}>
                  {EUROPEAN_CITIES.filter((c) => c.region === region).map(
                    (city) => (
                      <option key={city.id} value={city.label}>
                        {city.label}, {city.country}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
          </div>

          <button
            onClick={() =>
              selectedCorridor
                ? handleCorridorCalculate(selectedCorridor)
                : handleCalculate()
            }
            disabled={calculating || originLabel === destLabel}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {calculating ? "Изчисляване..." : "Изчисли маршрут"}
          </button>
        </div>

        {activeRoute && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-blue-800/50 bg-blue-900/20 p-4">
              <h2 className="mb-3 font-semibold text-blue-300">
                Активен маршрут
              </h2>
              <p className="text-lg">
                {activeRoute.origin.label} → {activeRoute.destination.label}
              </p>
              {activeRoute.waypoints.length > 0 && (
                <p className="mt-1 text-sm text-gray-400">
                  През:{" "}
                  {activeRoute.waypoints.map((w) => w.label).join(" → ")}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-300">
                <span>📏 {activeRoute.distance_km} км</span>
                <span>⏱️ {formatDuration(activeRoute.duration_min)}</span>
                {longHaul && (
                  <span className="text-amber-400">
                    🌙 Дълго пътуване — препоръчват се {restStops + 1} почивки
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/"
                  className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                >
                  Виж на картата
                </Link>
                <Link
                  href={`/borders?route=1${routeBorders.length ? `&border_ids=${routeBorders.join(",")}` : ""}`}
                  className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
                >
                  Граници по маршрута
                </Link>
                <Link
                  href="/weather"
                  className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
                >
                  Прогноза
                </Link>
                <Link
                  href="/fuel"
                  className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
                >
                  Гориво / EV
                </Link>
                <Link
                  href="/hotels"
                  className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
                >
                  Почивки
                </Link>
                {longHaul && (
                  <Link
                    href="/tips"
                    className="rounded bg-amber-700/50 px-4 py-2 text-sm text-amber-200 hover:bg-amber-700/70"
                  >
                    Съвети за дълъг път
                  </Link>
                )}
                <button
                  onClick={clearRoute}
                  className="rounded bg-gray-800 px-4 py-2 text-sm text-gray-400 hover:text-red-400"
                >
                  Изчисти
                </button>
              </div>
            </div>

            {routeBorders.length > 0 && (
              <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-300">
                  Граници по маршрута ({routeBorders.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Проверете опашките преди тръгване — особено при пътувания над
                  24 часа.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
