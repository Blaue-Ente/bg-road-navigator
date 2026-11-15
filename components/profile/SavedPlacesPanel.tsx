"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useQuery } from "@tanstack/react-query";
import { WazeCard } from "@/components/ui/WazeCard";
import type { SavedPlace, SavedPlaceCategory } from "@/types/place.types";

import { useMemo } from "react";

export function SavedPlacesPanel() {
  const m = useMessages();
  const categoryLabel = useMemo(
    (): Record<SavedPlaceCategory, string> => ({
      home: m.profile.msg92f3f459ec,
      work: m.profile.msg75436e3162,
      favorite: m.favorites.msg23f59a5c01,
      overnight: m.prefs.overnight,
      fuel: m.kinds.fuel,
      ev_charge: "EV",
      border: m.profile.msgd8e26625e7,
      food: m.profile.msg4e323b910b,
      rest: m.kinds.rest,
      other: m.profile.msgadc85a7a3b,
    }),
    [m]
  );
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["saved-places", m],
    queryFn: async () => {
      const response = await fetch("/api/saved-places");
      if (response.status === 401) {
        throw new Error(m.profile.msg9e9305573d);
      }
      if (!response.ok) throw new Error(m.profile.msg5cfe760bfc);
      return response.json() as Promise<{
        places: SavedPlace[];
        configured: boolean;
      }>;
    },
  });

  const remove = async (id: string) => {
    const response = await fetch(`/api/saved-places/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    await refetch();
  };

  if (isLoading) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-muted)]">{m.fuelPage.retrying}</p>
      </WazeCard>
    );
  }

  if (data && !data.configured) {
    return (
      <WazeCard>
        <h2 className="mb-2 text-base font-semibold text-[var(--waze-accent-text)]">{m.favorites.places}</h2>
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {m.profile.msg5423f8fb05}
        </p>
      </WazeCard>
    );
  }

  const places = data?.places ?? [];

  return (
    <WazeCard>
      <h2 className="mb-3 text-base font-semibold text-[var(--waze-accent-text)]">{m.favorites.places}</h2>
      {isError && (
        <p className="mb-2 text-sm text-[var(--waze-danger)]">
          {error instanceof Error ? error.message : m.profile.msg38ba72b10a}
        </p>
      )}
      {places.length === 0 ? (
        <p className="text-sm text-[var(--waze-text-muted)]">{m.profile.msg2a0caba8be}</p>
      ) : (
        <ul className="space-y-3">
          {places.map((place) => (
            <li
              key={place.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--waze-text)]">
                  {place.label}
                </p>
                <p className="text-xs text-[var(--waze-text-muted)]">
                  {categoryLabel[place.category]}
                  {place.place.subtitle ? ` · ${place.place.subtitle}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(place.id)}
                className="shrink-0 text-xs text-[var(--waze-danger)]"
              >{m.profile.msg7cc236d2ac}</button>
            </li>
          ))}
        </ul>
      )}
    </WazeCard>
  );
}
