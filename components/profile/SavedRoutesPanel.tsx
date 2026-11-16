"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRouteStore } from "@/lib/stores/route.store";
import { WazeCard } from "@/components/ui/WazeCard";
import { unitsFrom } from "@/lib/i18n/units";
import { formatDuration } from "@/lib/utils/route-planner";
import type { Route, SavedRoute } from "@/types/route.types";

export function SavedRoutesPanel() {
  const m = useMessages();
  const units = unitsFrom(m);
  const router = useRouter();
  const setActiveRoute = useRouteStore((s) => s.setActiveRoute);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["saved-routes", m],
    queryFn: async (): Promise<{
      routes: SavedRoute[];
      configured: boolean;
    }> => {
      const response = await fetch("/api/saved-routes");
      if (response.status === 401) {
        throw new Error(m.profile.msg9e9305573d);
      }
      if (!response.ok) throw new Error(m.profile.msgb1270f88cb);
      return response.json();
    },
  });

  const remove = async (id: string) => {
    const response = await fetch(`/api/saved-routes/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    await refetch();
  };

  const openRoute = (saved: SavedRoute) => {
    if (saved.route_geojson) {
      const route: Route = {
        id: saved.id,
        origin: {
          id: "origin",
          label: saved.origin_label,
          coords: saved.origin_coords,
        },
        destination: {
          id: "destination",
          label: saved.destination_label,
          coords: saved.destination_coords,
        },
        waypoints: [],
        distance_km: saved.distance_km ?? 0,
        duration_min: saved.duration_min ?? 0,
        geometry: saved.route_geojson,
        alternatives: [],
      };
      setActiveRoute(route);
    }
    router.push("/route");
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
        <h2 className="mb-2 text-base font-semibold text-[var(--waze-accent-text)]">{m.profile.msg0b5088b389}</h2>
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {m.profile.msga7eb453f0c}
        </p>
      </WazeCard>
    );
  }

  const routes = data?.routes ?? [];

  return (
    <WazeCard>
      <h2 className="mb-3 text-base font-semibold text-[var(--waze-accent-text)]">{m.profile.msg0b5088b389}</h2>
      {isError && (
        <p className="mb-2 text-sm text-[var(--waze-danger)]">
          {error instanceof Error ? error.message : m.profile.msg38ba72b10a}
        </p>
      )}
      {routes.length === 0 ? (
        <p className="text-sm text-[var(--waze-text-muted)]">
          {m.profile.msg9c152126de}
        </p>
      ) : (
        <ul className="space-y-3">
          {routes.map((route) => (
            <li
              key={route.id}
              className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-3"
            >
              <p className="font-medium text-[var(--waze-text)]">
                {route.name}
              </p>
              <p className="mt-1 text-xs text-[var(--waze-text-muted)]">
                {route.distance_km ?? "—"}
                {m.units.kmPrefix} ·{" "}
                {route.duration_min != null
                  ? formatDuration(route.duration_min, units)
                  : "—"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => openRoute(route)}
                  className="waze-btn-primary px-3 py-1.5 text-xs"
                >
                  {m.profile.openRoute}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(route.id)}
                  className="waze-btn-secondary px-3 py-1.5 text-xs text-[var(--waze-danger)]"
                >{m.profile.msg7cc236d2ac}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WazeCard>
  );
}
