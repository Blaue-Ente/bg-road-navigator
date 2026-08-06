"use client";

import type { Route } from "@/types/route.types";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
} from "@/lib/utils/maps-handoff";

interface MapsHandoffButtonsProps {
  route: Route;
}

export function MapsHandoffButtons({ route }: MapsHandoffButtonsProps) {
  const google = googleMapsDirectionsUrl(
    route.origin.coords,
    route.destination.coords
  );
  const apple = appleMapsDirectionsUrl(
    route.origin.coords,
    route.destination.coords
  );

  return (
    <>
      <a
        href={google}
        target="_blank"
        rel="noopener noreferrer"
        className="waze-btn-primary px-4 py-2 text-sm"
      >
        Google Maps
      </a>
      <a
        href={apple}
        target="_blank"
        rel="noopener noreferrer"
        className="waze-btn-secondary px-4 py-2 text-sm"
      >
        Apple Maps
      </a>
    </>
  );
}
