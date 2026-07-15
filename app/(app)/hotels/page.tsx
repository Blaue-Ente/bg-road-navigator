"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RestAreaCard } from "@/components/hotels/RestAreaCard";
import {
  EUROPEAN_REST_AREAS,
  getRestAreasForCorridor,
} from "@/lib/constants/rest-areas";
import { TRAVEL_CORRIDORS } from "@/lib/constants/european-corridors";

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-gray-400">Зареждане...</div>}>
      <HotelsPageContent />
    </Suspense>
  );
}

function HotelsPageContent() {
  const searchParams = useSearchParams();
  const corridorFromUrl = searchParams.get("corridor");
  const [selectedCorridor, setSelectedCorridor] = useState<string | null>(
    corridorFromUrl
  );

  const areas = selectedCorridor
    ? getRestAreasForCorridor(selectedCorridor)
    : EUROPEAN_REST_AREAS;

  return (
    <div className="h-full overflow-y-auto p-4 pb-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-bold text-blue-400">
          Почивки и нощувки
        </h1>
        <p className="mb-6 text-sm text-gray-400">
          Места за почивка и пренощуване по европейските коридори — за дълги
          пътувания над 12–30+ часа
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCorridor(null)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              !selectedCorridor
                ? "border-blue-500 bg-blue-600/30 text-blue-300"
                : "border-gray-700 bg-gray-900 text-gray-300"
            }`}
          >
            Всички
          </button>
          {TRAVEL_CORRIDORS.map((corridor) => (
            <button
              key={corridor.id}
              onClick={() => setSelectedCorridor(corridor.id)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                selectedCorridor === corridor.id
                  ? "border-blue-500 bg-blue-600/30 text-blue-300"
                  : "border-gray-700 bg-gray-900 text-gray-300"
              }`}
            >
              {corridor.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {areas.length === 0 ? (
            <p className="text-center text-gray-500">
              Няма записани почивни зони за този коридор.
            </p>
          ) : (
            areas.map((area) => (
              <div key={area.id}>
                <RestAreaCard
                  name={area.name}
                  location={`${area.location} · ${area.country}`}
                  facilities={area.facilities}
                  distanceKm={0}
                  coords={area.coords}
                />
                {area.notes && (
                  <p className="mt-1 px-1 text-xs text-gray-500">{area.notes}</p>
                )}
              </div>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          При пътувания над 24 часа резервирайте хотели предварително по
          маршрута.
        </p>
      </div>
    </div>
  );
}
