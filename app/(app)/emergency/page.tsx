"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useMemo, useState } from "react";
import { EMERGENCY_DATA } from "@/lib/constants/emergency-numbers";
import { CountryEmergencyCard } from "@/components/emergency/CountryEmergencyCard";
import { RoadsideAdviceAccordion } from "@/components/emergency/RoadsideAdviceAccordion";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import {
  useGeolocation,
  locateStatusMessage,
} from "@/lib/hooks/useGeolocation";
import { useMapStore } from "@/lib/stores/map.store";
import type { NearbyPlace } from "@/types/emergency.types";

export default function EmergencyPage() {
  const m = useMessages();
  const roadsideAdvice = useMemo(
    () => [
      {
        title: m.emergencyPage.msg7592dc7a79,
        content: m.emergencyPage.accidentAdviceSteps,
      },
      {
        title: m.emergencyPage.msg68e7c3086d,
        content: m.emergencyPage.breakdownAdviceSteps,
      },
      {
        title: m.emergencyPage.msg98d39a558c,
        content: m.emergencyPage.msg4fc5786285,
      },
    ],
    [m]
  );
  const { getCurrentLocation } = useGeolocation();
  const locateStatus = useMapStore((s) => s.locateStatus);
  const [places, setPlaces] = useState<NearbyPlace[] | null>(null);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const locateHint = locateStatusMessage(locateStatus);

  const loadNearby = async () => {
    setLoadingNearby(true);
    setNearbyError(null);
    const position = await getCurrentLocation();
    if (!position) {
      setLoadingNearby(false);
      setNearbyError(m.emergencyPage.msgeb35f61b99);
      return;
    }
    try {
      const response = await fetch(
        `/api/emergency/nearby?lng=${position.coords.longitude}&lat=${position.coords.latitude}`
      );
      if (!response.ok) throw new Error("nearby");
      const payload = (await response.json()) as {
        places: NearbyPlace[];
        disclaimer_bg?: string;
      };
      setPlaces(payload.places);
    } catch {
      setNearbyError(m.emergencyPage.msg1fa67cc21a);
    } finally {
      setLoadingNearby(false);
    }
  };

  const hospitals = useMemo(
    () => (places ?? []).filter((p) => p.kind === "hospital"),
    [places]
  );
  const garages = useMemo(
    () => (places ?? []).filter((p) => p.kind === "garage"),
    [places]
  );

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-4xl">
        <PageHeader
          title={m.emergencyPage.msg4ef1670a33}
          subtitle={m.emergencyPage.msgc24fe9a6dc}
        />

        <WazeCard className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">{m.emergencyPage.msga6d31c086c}</h2>
          <p className="mb-3 text-xs text-[var(--waze-text-muted)]">
            {m.emergencyPage.openstreetmap2608}
          </p>
          <button
            type="button"
            onClick={() => void loadNearby()}
            className="waze-btn-primary px-4 py-2 text-sm disabled:opacity-50"
            disabled={loadingNearby}
          >
            {loadingNearby ? m.emergencyPage.msg463a0f99c5 : m.emergencyPage.msga7fa912ad0}
          </button>
          {locateHint && (
            <p className="mt-2 text-xs text-[var(--waze-text-secondary)]">
              {locateHint}
            </p>
          )}
          {nearbyError && (
            <p className="mt-2 text-sm text-[var(--waze-danger)]">{nearbyError}</p>
          )}
          {places && places.length === 0 && (
            <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
              {m.emergencyPage.msgd369cbeba1}
            </p>
          )}
          {hospitals.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">{m.emergencyPage.msg6111da6b0f}</h3>
              {hospitals.slice(0, 5).map((place) => (
                <NearbyPlaceRow key={place.id} place={place} />
              ))}
            </div>
          )}
          {garages.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">{m.emergencyPage.msg4c39860732}</h3>
              {garages.slice(0, 5).map((place) => (
                <NearbyPlaceRow key={place.id} place={place} />
              ))}
            </div>
          )}
        </WazeCard>

        <section className="mb-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent-text)]">{m.emergencyPage.msg32e41076b5}</h2>
          <div className="grid grid-cols-1 gap-3">
            {EMERGENCY_DATA.map((country) => (
              <CountryEmergencyCard key={country.country} country={country} />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <RoadsideAdviceAccordion adviceSections={roadsideAdvice} />
        </section>
      </div>
    </div>
  );
}

function NearbyPlaceRow({ place }: { place: NearbyPlace }) {
  const m = useMessages();
  return (
    <a
      href={place.maps_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
    >
      <p className="font-medium text-[var(--waze-text)]">{place.name}</p>
      <p className="text-xs text-[var(--waze-text-muted)]">
        {place.distance_km != null
          ? `${place.distance_km}${m.units.kmPrefix}`
          : ""}{" "}
        {place.address ?? ""}
        {place.phone ? ` · ${place.phone}` : ""}
      </p>
    </a>
  );
}
