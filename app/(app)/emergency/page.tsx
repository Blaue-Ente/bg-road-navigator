"use client";

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

const ROADSIDE_ADVICE = [
  {
    title: "Какво да правите при катастрофа",
    content:
      "1. Спрете на безопасно място\n2. Включете аварийните светлини\n3. Поставете триъгълника на 30-100м зад колата\n4. Обадете се на 112\n5. Не местете автомобила без полиция, ако има пострадали",
  },
  {
    title: "Какво да правите при повреда",
    content:
      "1. Отдръпнете се от пътното платно\n2. Сложете жилетка\n3. Поставете предупредителен триъгълник\n4. Извикайте пътна помощ\n5. Не правете ремонт на активна лента",
  },
  {
    title: "Задължителни документи за пътуване в ЕС",
    content:
      "Лична карта/паспорт, шофьорска книжка, регистрационен талон, застраховка Гражданска отговорност / Зелена карта където се изисква, винетка само в държавите с официална винетка.",
  },
];

export default function EmergencyPage() {
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
      setNearbyError("Нужна е локация, за да потърсим болници и сервизи.");
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
      setNearbyError("OpenStreetMap не върна резултати. Опитайте отново.");
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
          title="Спешни ситуации"
          subtitle="Телефони по държави и най-близки болници/сервизи от OpenStreetMap"
        />

        <WazeCard className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
            Близо до вас
          </h2>
          <p className="mb-3 text-xs text-[var(--waze-text-muted)]">
            Данни от OpenStreetMap — може да не са пълни или в реално време.
            Няма предварително написани фалшиви сервизи.
          </p>
          <button
            type="button"
            onClick={() => void loadNearby()}
            className="waze-btn-primary px-4 py-2 text-sm disabled:opacity-50"
            disabled={loadingNearby}
          >
            {loadingNearby ? "Търсене…" : "Намери болници и сервизи"}
          </button>
          {locateHint && (
            <p className="mt-2 text-xs text-[var(--waze-text-secondary)]">
              {locateHint}
            </p>
          )}
          {nearbyError && (
            <p className="mt-2 text-sm text-red-400">{nearbyError}</p>
          )}
          {places && places.length === 0 && (
            <p className="mt-2 text-sm text-[var(--waze-text-secondary)]">
              Няма намерени обекти в радиус 15 км.
            </p>
          )}
          {hospitals.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
                Болници / клиники
              </h3>
              {hospitals.slice(0, 5).map((place) => (
                <NearbyPlaceRow key={place.id} place={place} />
              ))}
            </div>
          )}
          {garages.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
                Автосервизи
              </h3>
              {garages.slice(0, 5).map((place) => (
                <NearbyPlaceRow key={place.id} place={place} />
              ))}
            </div>
          )}
        </WazeCard>

        <section className="mb-8">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--waze-accent)]">
            Спешни телефони
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {EMERGENCY_DATA.map((country) => (
              <CountryEmergencyCard key={country.country} country={country} />
            ))}
          </div>
        </section>

        <section className="mb-8">
          <RoadsideAdviceAccordion adviceSections={ROADSIDE_ADVICE} />
        </section>
      </div>
    </div>
  );
}

function NearbyPlaceRow({ place }: { place: NearbyPlace }) {
  return (
    <a
      href={place.maps_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
    >
      <p className="font-medium text-[var(--waze-text)]">{place.name}</p>
      <p className="text-xs text-[var(--waze-text-muted)]">
        {place.distance_km != null ? `${place.distance_km} км` : ""}{" "}
        {place.address ?? ""}
        {place.phone ? ` · ${place.phone}` : ""}
      </p>
    </a>
  );
}
