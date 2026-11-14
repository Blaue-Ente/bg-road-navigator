"use client";

import type { Route } from "@/types/route.types";
import {
  buildMapsHandoff,
  GOOGLE_MAPS_MAX_WAYPOINTS,
  GOOGLE_MAPS_MOBILE_MAX_WAYPOINTS,
  type MapsHandoffPlan,
  stopsFromRoute,
} from "@/lib/utils/maps-handoff";

interface MapsHandoffButtonsProps {
  route: Route;
}

function HandoffLinks({ plan }: { plan: MapsHandoffPlan }) {
  const severalLegs = plan.legs.length > 1;
  const directTrip =
    plan.legs.length === 1 && plan.legs[0]?.waypoints.length === 0;

  return (
    <>
      {plan.legs.map((leg, index) => (
        <a
          key={`google-${index}`}
          href={leg.googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-primary px-4 py-2 text-sm"
        >
          {severalLegs
            ? `Google Maps — част ${index + 1}`
            : "Google Maps — старт навигация"}
        </a>
      ))}
      {plan.legs.map((leg, index) => (
        <a
          key={`apple-${index}`}
          href={leg.appleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-secondary px-4 py-2 text-sm"
        >
          {severalLegs ? `Apple Maps — част ${index + 1}` : "Apple Maps"}
        </a>
      ))}
      {plan.wazeStops.map((stop, index) => (
        <a
          key={`waze-${index}`}
          href={stop.url}
          target="_blank"
          rel="noopener noreferrer"
          className="waze-btn-secondary px-4 py-2 text-sm"
        >
          {directTrip
            ? "Waze — навигация"
            : index === 0
              ? "Waze — следваща спирка"
              : `Waze — ${stop.label ?? `спирка ${index + 1}`}`}
        </a>
      ))}
    </>
  );
}

export function MapsHandoffButtons({ route }: MapsHandoffButtonsProps) {
  const stops = stopsFromRoute(route);
  const desktop = buildMapsHandoff(stops, {
    maxWaypoints: GOOGLE_MAPS_MAX_WAYPOINTS,
  });
  const mobile = buildMapsHandoff(stops, {
    maxWaypoints: GOOGLE_MAPS_MOBILE_MAX_WAYPOINTS,
  });

  return (
    <>
      <div className="contents max-md:hidden">
        <HandoffLinks plan={desktop} />
      </div>
      <div className="contents md:hidden">
        <HandoffLinks plan={mobile} />
      </div>
    </>
  );
}
