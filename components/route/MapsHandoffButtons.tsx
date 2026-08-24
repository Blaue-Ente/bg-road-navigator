"use client";

import type { ReactNode } from "react";
import type { Route } from "@/types/route.types";
import { mapsHandoffUrls } from "@/lib/utils/maps-handoff";

interface MapsHandoffButtonsProps {
  route: Route;
  children?: ReactNode;
}

export function MapsHandoffButtons({
  route,
  children,
}: MapsHandoffButtonsProps) {
  const { google, apple, waze } = mapsHandoffUrls(
    route.origin.coords,
    route.destination.coords,
    route.geometry
  );

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap gap-2">
        <a
          href={google}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-primary px-4 py-2 text-sm"
        >
          Google Maps
        </a>
        <a
          href={waze}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-primary px-4 py-2 text-sm"
        >
          Waze
        </a>
        <a
          href={apple}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-secondary px-4 py-2 text-sm"
        >
          Apple Maps
        </a>
        {children}
      </div>
      <p className="text-xs leading-relaxed text-[var(--waze-text-muted)]">
        Отваря готовия маршрут за шофиране. Google и Apple минават през ключови
        точки от нашия път. Waze смята своя вариант между същото начало и край.
      </p>
    </div>
  );
}
