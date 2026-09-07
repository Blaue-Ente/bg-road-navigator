"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RestAreaCard } from "@/components/hotels/RestAreaCard";
import {
  EUROPEAN_REST_AREAS,
  getRestAreasForCorridor,
} from "@/lib/constants/rest-areas";
import { PageHeader } from "@/components/ui/PageHeader";
import { haversineKm } from "@/lib/geo/haversine";
import { useMapStore } from "@/lib/stores/map.store";

export default function HotelsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[var(--waze-text-muted)]">Зареждане…</div>
      }
    >
      <HotelsPageContent />
    </Suspense>
  );
}

function HotelsPageContent() {
  const searchParams = useSearchParams();
  const corridorFromUrl = searchParams.get("corridor");
  const userLocation = useMapStore((s) => s.userLocation);
  const areas = corridorFromUrl
    ? getRestAreasForCorridor(corridorFromUrl)
    : EUROPEAN_REST_AREAS;
  const isFiltered = Boolean(corridorFromUrl);

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Почивки и нощувки"
          subtitle="Зони за почивка по магистралите — паркинг, душ, храна и заряд"
        />

        {isFiltered && (
          <p className="mb-4 text-sm text-[var(--waze-text-secondary)]">
            Показани са зони по избрания маршрут.{" "}
            <Link href="/hotels" className="text-[var(--waze-accent)]">
              Виж всички
            </Link>
          </p>
        )}

        <div className="space-y-4">
          {areas.length === 0 ? (
            <p className="text-center text-[var(--waze-text-muted)]">
              Няма записани зони за почивка за този маршрут.
            </p>
          ) : (
            areas.map((area) => (
              <div key={area.id}>
                <RestAreaCard
                  name={area.name}
                  location={`${area.location} · ${area.country}`}
                  facilities={area.facilities}
                  distanceKm={
                    userLocation ? haversineKm(userLocation, area.coords) : 0
                  }
                  coords={area.coords}
                />
                {area.notes && (
                  <p className="mt-1 px-1 text-xs text-[var(--waze-text-muted)]">
                    {area.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--waze-text-muted)]">
          При пътувания над едно денонощие резервирайте нощувка предварително.
        </p>
      </div>
    </div>
  );
}
