"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RestAreaCard } from "@/components/hotels/RestAreaCard";
import {
  EUROPEAN_REST_AREAS,
  getRestAreasForCorridor,
  restAreaCountry,
  restAreaLocation,
  restAreaName,
  restAreaNotes,
} from "@/lib/constants/rest-areas";
import { PageHeader } from "@/components/ui/PageHeader";
import { haversineKm } from "@/lib/geo/haversine";
import { useMapStore } from "@/lib/stores/map.store";

export default function HotelsPage() {
  const m = useMessages();
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[var(--waze-text-muted)]">{m.fuelPage.msg0a434f910d}</div>
      }
    >
      <HotelsPageContent />
    </Suspense>
  );
}

function HotelsPageContent() {
  const m = useMessages();
  const locale = useLocale();
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
          title={m.hotelsPage.msg06e21a5dc4}
          subtitle={m.hotelsPage.msgc83074c070}
        />

        {isFiltered && (
          <p className="mb-4 text-sm text-[var(--waze-text-secondary)]">
            {m.hotelsPage.filteredCorridorPrefix}{" "}
            <Link href="/hotels" className="text-[var(--waze-accent-text)]">{m.hotelsPage.msg3634fd6854}</Link>
          </p>
        )}

        <div className="space-y-4">
          {areas.length === 0 ? (
            <p className="text-center text-[var(--waze-text-muted)]">{m.hotelsPage.msgf7be326529}</p>
          ) : (
            areas.map((area) => (
              <div key={area.id}>
                <RestAreaCard
                  name={restAreaName(locale, area)}
                  location={`${restAreaLocation(locale, area)} · ${restAreaCountry(locale, area)}`}
                  facilities={area.facilities}
                  distanceKm={
                    userLocation ? haversineKm(userLocation, area.coords) : 0
                  }
                  coords={area.coords}
                />
                {restAreaNotes(locale, area) && (
                  <p className="mt-1 px-1 text-xs text-[var(--waze-text-muted)]">
                    {restAreaNotes(locale, area)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--waze-text-muted)]">{m.hotelsPage.msg86de128e73}</p>
      </div>
    </div>
  );
}
