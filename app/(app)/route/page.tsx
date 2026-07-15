"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouteStore } from "@/lib/stores/route.store";

const CITIES = [
  { label: "София", coords: { lng: 23.3219, lat: 42.6977 } },
  { label: "Пловдив", coords: { lng: 24.7453, lat: 42.1354 } },
  { label: "Варна", coords: { lng: 27.9147, lat: 43.2141 } },
  { label: "Бургас", coords: { lng: 27.4626, lat: 42.5048 } },
  { label: "Калотина", coords: { lng: 22.8969, lat: 42.9833 } },
  { label: "Кулата", coords: { lng: 23.7781, lat: 41.3972 } },
  { label: "Русе", coords: { lng: 25.9708, lat: 43.8356 } },
  { label: "Солун", coords: { lng: 22.9444, lat: 40.6401 } },
  { label: "Букурещ", coords: { lng: 26.1025, lat: 44.4268 } },
  { label: "Истанбул", coords: { lng: 28.9784, lat: 41.0082 } },
];

function haversineKm(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number }
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export default function RoutePage() {
  const { activeRoute, setActiveRoute, clearRoute } = useRouteStore();
  const [originLabel, setOriginLabel] = useState(
    activeRoute?.origin.label ?? "София"
  );
  const [destLabel, setDestLabel] = useState(
    activeRoute?.destination.label ?? "Калотина"
  );
  const [calculating, setCalculating] = useState(false);

  const handleCalculate = () => {
    const origin = CITIES.find((c) => c.label === originLabel);
    const dest = CITIES.find((c) => c.label === destLabel);

    if (!origin || !dest) return;

    setCalculating(true);

    const distance = haversineKm(origin.coords, dest.coords);
    const duration = Math.round((distance / 80) * 60);

    const route = {
      id: `route-${Date.now()}`,
      origin: {
        id: "origin",
        label: origin.label,
        coords: origin.coords,
      },
      destination: {
        id: "dest",
        label: dest.label,
        coords: dest.coords,
      },
      waypoints: [],
      distance_km: Math.round(distance * 10) / 10,
      duration_min: duration,
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [origin.coords.lng, origin.coords.lat],
          [dest.coords.lng, dest.coords.lat],
        ],
      },
      alternatives: [],
    };

    setTimeout(() => {
      setActiveRoute(route);
      setCalculating(false);
    }, 400);
  };

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-blue-400">
          Планиране на маршрут
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Изберете начална и крайна точка за пътуване до България
        </p>

        <div className="space-y-4 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div>
            <label className="mb-1 block text-sm text-gray-400">Откъде</label>
            <select
              value={originLabel}
              onChange={(e) => setOriginLabel(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2"
            >
              {CITIES.map((city) => (
                <option key={city.label} value={city.label}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-400">Накъде</label>
            <select
              value={destLabel}
              onChange={(e) => setDestLabel(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2"
            >
              {CITIES.map((city) => (
                <option key={city.label} value={city.label}>
                  {city.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCalculate}
            disabled={calculating || originLabel === destLabel}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {calculating ? "Изчисляване..." : "Изчисли маршрут"}
          </button>
        </div>

        {activeRoute && (
          <div className="mt-6 rounded-lg border border-blue-800/50 bg-blue-900/20 p-4">
            <h2 className="mb-3 font-semibold text-blue-300">Активен маршрут</h2>
            <p className="text-lg">
              {activeRoute.origin.label} → {activeRoute.destination.label}
            </p>
            <div className="mt-2 flex gap-4 text-sm text-gray-300">
              <span>📏 {activeRoute.distance_km} км</span>
              <span>⏱️ ~{activeRoute.duration_min} мин</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Виж на картата
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
                Гориво
              </Link>
              <button
                onClick={clearRoute}
                className="rounded bg-gray-800 px-4 py-2 text-sm text-gray-400 hover:text-red-400"
              >
                Изчисти
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
