"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";
import type { Route } from "@/types/route.types";

interface SaveRouteButtonProps {
  route: Route;
  className?: string;
}

export function SaveRouteButton({ route, className }: SaveRouteButtonProps) {
  const m = useMessages();
  const session = useUserStore((s) => s.session);
  const profile = useUserStore((s) => s.profile);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <Link
        href="/login"
        className={className ?? "waze-btn-secondary px-4 py-2 text-sm"}
      >{m.route.msg4cf81beb12}</Link>
    );
  }

  const save = async () => {
    if (status === "saving" || status === "saved") return;
    setStatus("saving");
    setError(null);
    try {
      const response = await fetch("/api/saved-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin_label: route.origin.label,
          origin_coords: route.origin.coords,
          destination_label: route.destination.label,
          destination_coords: route.destination.coords,
          waypoints: route.waypoints.map((w) => ({
            id: w.id,
            label: w.label,
            coords: w.coords,
          })),
          route_geojson: route.geometry,
          distance_km: route.distance_km,
          duration_min: route.duration_min,
          vehicle_type: profile?.vehicle_type ?? "car",
        }),
      });

      if (response.status === 401) {
        setStatus("error");
        setError(m.favorites.msg633c0751dd);
        return;
      }
      if (response.status === 503) {
        setStatus("error");
        setError(m.route.msg56065d0fd1);
        return;
      }
      if (!response.ok) throw new Error("save failed");
      setStatus("saved");
    } catch {
      setStatus("error");
      setError(m.route.msgffafcc5443);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void save()}
      disabled={status === "saving" || status === "saved"}
      className={className ?? "waze-btn-secondary px-4 py-2 text-sm"}
    >
      {status === "saved"
        ? m.route.msg795550aaa0
        : status === "saving"
          ? m.route.msg4d3d6bad08
          : status === "error"
            ? (error ?? m.favorites.msge0baf32095)
            : m.route.msg366a87eb84}
    </button>
  );
}
