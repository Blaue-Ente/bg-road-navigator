/**
 * Place search and reverse geocoding.
 * Photon when OCI geo is configured; Nominatim otherwise, and on Photon failure.
 * With the OCI variables removed, this is the previous Nominatim path.
 */

import {
  logGeo,
  ociGeoEnvState,
  readOciGeoConfig,
  shouldFallback,
} from "@/lib/api-clients/oci-geo";
import {
  reverseEuropeanPlace,
  searchEuropeanPlaces,
} from "@/lib/api-clients/nominatim";
import {
  reversePhoton,
  searchPhoton,
  type GeocodeContext,
} from "@/lib/api-clients/photon";
import type { RoutePoint } from "@/types/route.types";

export type { GeocodeContext };

export async function searchPlaces(
  query: string,
  context?: GeocodeContext
): Promise<RoutePoint[]> {
  const state = ociGeoEnvState();
  if (state === "ready") {
    const config = readOciGeoConfig();
    if (config) {
      const photon = await searchPhoton(query, context, config);
      if (photon.ok) {
        logGeo("geocode", {
          provider: "photon",
          op: "search",
          outcome: "ok",
          results: photon.places.length,
        });
        return photon.places;
      }
      if (!shouldFallback(photon.outcome)) {
        logGeo("geocode", {
          provider: "photon",
          op: "search",
          outcome: photon.outcome,
          fallback: "none",
        });
        return [];
      }
      logGeo("geocode", {
        provider: "photon",
        op: "search",
        outcome: photon.outcome,
        fallback: "nominatim",
      });
    }
  } else if (state === "incomplete") {
    logGeo("geocode", {
      provider: "photon",
      op: "search",
      outcome: "skipped",
      reason: "incomplete_env",
      fallback: "nominatim",
    });
  }

  const places = await searchEuropeanPlaces(query);
  logGeo("geocode", {
    provider: "nominatim",
    op: "search",
    outcome: "ok",
    results: places.length,
  });
  return places;
}

export async function reversePlace(
  lat: number,
  lng: number,
  context?: { lang?: string }
): Promise<RoutePoint | null> {
  const state = ociGeoEnvState();
  if (state === "ready") {
    const config = readOciGeoConfig();
    if (config) {
      const photon = await reversePhoton(lat, lng, context, config);
      if (photon.ok) {
        logGeo("geocode", {
          provider: "photon",
          op: "reverse",
          outcome: photon.place ? "ok" : "empty",
          results: photon.place ? 1 : 0,
        });
        return photon.place;
      }
      if (!shouldFallback(photon.outcome)) {
        logGeo("geocode", {
          provider: "photon",
          op: "reverse",
          outcome: photon.outcome,
          fallback: "none",
        });
        return null;
      }
      logGeo("geocode", {
        provider: "photon",
        op: "reverse",
        outcome: photon.outcome,
        fallback: "nominatim",
      });
    }
  } else if (state === "incomplete") {
    logGeo("geocode", {
      provider: "photon",
      op: "reverse",
      outcome: "skipped",
      reason: "incomplete_env",
      fallback: "nominatim",
    });
  }

  const place = await reverseEuropeanPlace(lat, lng);
  logGeo("geocode", {
    provider: "nominatim",
    op: "reverse",
    outcome: place ? "ok" : "empty",
    results: place ? 1 : 0,
  });
  return place;
}
