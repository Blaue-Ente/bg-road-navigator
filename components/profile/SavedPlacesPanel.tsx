"use client";

import { useQuery } from "@tanstack/react-query";
import { WazeCard } from "@/components/ui/WazeCard";
import type { SavedPlace, SavedPlaceCategory } from "@/types/place.types";

const CATEGORY_LABEL: Record<SavedPlaceCategory, string> = {
  home: "Дом",
  work: "Работа",
  favorite: "Любимо",
  overnight: "Нощувка",
  fuel: "Гориво",
  ev_charge: "EV",
  border: "Граница",
  food: "Хранене",
  rest: "Почивка",
  other: "Друго",
};

async function fetchSavedPlaces(): Promise<{
  places: SavedPlace[];
  configured: boolean;
}> {
  const response = await fetch("/api/saved-places");
  if (response.status === 401) {
    throw new Error("Сесията е изтекла.");
  }
  if (!response.ok) throw new Error("Любимите места не могат да бъдат заредени.");
  return response.json();
}

export function SavedPlacesPanel() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["saved-places"],
    queryFn: fetchSavedPlaces,
  });

  const remove = async (id: string) => {
    const response = await fetch(`/api/saved-places/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    await refetch();
  };

  if (isLoading) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-muted)]">Зареждане…</p>
      </WazeCard>
    );
  }

  if (data && !data.configured) {
    return (
      <WazeCard>
        <h2 className="mb-2 text-base font-semibold text-[var(--waze-accent)]">
          Любими места
        </h2>
        <p className="text-sm text-[var(--waze-text-muted)]">
          Любимите граници, бензиностанции и места изискват Supabase.
        </p>
      </WazeCard>
    );
  }

  const places = data?.places ?? [];

  return (
    <WazeCard>
      <h2 className="mb-3 text-base font-semibold text-[var(--waze-accent)]">
        Любими места
      </h2>
      {isError && (
        <p className="mb-2 text-sm text-red-400">
          {error instanceof Error ? error.message : "Грешка при зареждане"}
        </p>
      )}
      {places.length === 0 ? (
        <p className="text-sm text-[var(--waze-text-muted)]">
          Все още няма любими. Добавете от екраните „Граници“ или „Гориво“.
        </p>
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
                  {CATEGORY_LABEL[place.category]}
                  {place.place.subtitle ? ` · ${place.place.subtitle}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void remove(place.id)}
                className="shrink-0 text-xs text-red-400"
              >
                Изтрий
              </button>
            </li>
          ))}
        </ul>
      )}
    </WazeCard>
  );
}
