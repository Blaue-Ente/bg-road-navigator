"use client";

import { useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { WazeCard } from "@/components/ui/WazeCard";
import { messages as m } from "@/lib/i18n";
import { readFavoriteEnvelope } from "@/lib/planner/favorite-envelope";
import { resolveTripPreferences, type TripPreferences } from "@/lib/planner/preferences";
import { useRouteStore } from "@/lib/stores/route.store";
import type { RoutePoint } from "@/types/route.types";

interface FavoriteRoute {
  id: string;
  name: string;
  origin: { label: string; lng: number; lat: number };
  destination: { label: string; lng: number; lat: number };
  preferences: TripPreferences;
  plan: unknown;
}

interface FavoritePlace {
  id: string;
  kind: string;
  name: string;
  lat: number;
  lng: number;
  note: string | null;
}

export function FavoritesPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setReplanDraft = useRouteStore((state) => state.setReplanDraft);
  const replanToken = useRef(0);
  const routes = useQuery({
    queryKey: ["favorite-routes"],
    queryFn: () => readList<FavoriteRoute>("/api/favorites/routes", "routes"),
  });
  const places = useQuery({
    queryKey: ["favorite-places"],
    queryFn: () => readList<FavoritePlace>("/api/favorites/places", "places"),
  });

  const openRoute = (route: FavoriteRoute) => {
    const stored = readFavoriteEnvelope(route.plan);
    const via = stored.inputs?.via[0];
    setReplanDraft({
      token: ++replanToken.current,
      origin: toPoint("origin", route.origin),
      destination: toPoint("destination", route.destination),
      via: via ? toPoint("via", via) : null,
      preferences: resolveTripPreferences(route.preferences),
      departAt: stored.inputs?.depart_at ?? route.preferences.depart_at ?? null,
      fuelLevel: stored.inputs?.fuel_level ?? 0.8,
    });
    router.push("/route");
  };

  const remove = async (kind: "routes" | "places", id: string) => {
    const response = await fetch(`/api/favorites/${kind}/${id}`, { method: "DELETE" });
    if (!response.ok) return;
    await queryClient.invalidateQueries({
      queryKey: [kind === "routes" ? "favorite-routes" : "favorite-places"],
    });
  };

  return (
    <WazeCard>
      <h2 className="text-base font-semibold text-[var(--waze-accent-text)]">
        {m.favorites.title}
      </h2>
      <FavoriteBlock
        title={m.favorites.routes}
        loading={routes.isLoading}
        failed={routes.isError}
        unavailable={routes.data?.configured === false}
        empty={m.favorites.emptyRoutes}
        count={routes.data?.items.length ?? 0}
      >
        <ul className="space-y-2">
          {(routes.data?.items ?? []).map((route) => (
            <li
              key={route.id}
              className="rounded-xl bg-[var(--waze-surface-elevated)] p-3"
            >
              <p className="font-medium text-[var(--waze-text)]">{route.name}</p>
              <p className="text-sm text-[var(--waze-text-secondary)]">
                {route.origin.label} → {route.destination.label}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openRoute(route)}
                  className="waze-btn-secondary px-3 py-1.5 text-xs"
                >
                  {m.favorites.open}
                </button>
                <button
                  type="button"
                  onClick={() => void remove("routes", route.id)}
                  className="waze-btn-secondary px-3 py-1.5 text-xs text-[var(--waze-danger)]"
                >
                  {m.favorites.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </FavoriteBlock>
      <FavoriteBlock
        title={m.favorites.places}
        loading={places.isLoading}
        failed={places.isError}
        unavailable={places.data?.configured === false}
        empty={m.favorites.emptyPlaces}
        count={places.data?.items.length ?? 0}
      >
        <ul className="space-y-2">
          {(places.data?.items ?? []).map((place) => (
            <li
              key={place.id}
              className="rounded-xl bg-[var(--waze-surface-elevated)] p-3"
            >
              <p className="font-medium text-[var(--waze-text)]">{place.name}</p>
              <p className="text-sm text-[var(--waze-text-secondary)]">
                {placeKind(place.kind)}
                {place.note ? ` · ${place.note}` : ""}
              </p>
              <button
                type="button"
                onClick={() => void remove("places", place.id)}
                className="waze-btn-secondary mt-2 px-3 py-1.5 text-xs text-[var(--waze-danger)]"
              >
                {m.favorites.remove}
              </button>
            </li>
          ))}
        </ul>
      </FavoriteBlock>
    </WazeCard>
  );
}

function FavoriteBlock({
  title,
  loading,
  failed,
  unavailable,
  empty,
  count,
  children,
}: {
  title: string;
  loading: boolean;
  failed: boolean;
  unavailable: boolean;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  const ready = !loading && !failed && !unavailable;
  return (
    <section className="mt-4">
      <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">{title}</h3>
      {loading && (
        <p className="text-sm text-[var(--waze-text-muted)]">{m.favorites.loading}</p>
      )}
      {failed && (
        <p className="text-sm text-[var(--waze-danger)]">{m.favorites.failed}</p>
      )}
      {unavailable && (
        <p className="text-sm text-[var(--waze-text-secondary)]">{m.favorites.unavailable}</p>
      )}
      {ready && count === 0 && (
        <p className="text-sm text-[var(--waze-text-secondary)]">{empty}</p>
      )}
      {ready && count > 0 ? children : null}
    </section>
  );
}

async function readList<T>(
  url: string,
  key: string
): Promise<{ items: T[]; configured: boolean }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("favorites");
  const payload = (await response.json()) as {
    configured?: boolean;
    routes?: T[];
    places?: T[];
  };
  const items = (key === "routes" ? payload.routes : payload.places) ?? [];
  return { items, configured: payload.configured !== false };
}

function toPoint(
  id: string,
  point: { label: string; lng: number; lat: number }
): RoutePoint {
  return {
    id,
    label: point.label,
    coords: { lng: point.lng, lat: point.lat },
    source: "user",
  };
}

function placeKind(kind: string): string {
  if (kind in m.favorites.kinds) {
    return m.favorites.kinds[kind as keyof typeof m.favorites.kinds];
  }
  return m.favorites.kinds.custom;
}
