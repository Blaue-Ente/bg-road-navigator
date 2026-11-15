/**
 * Driving routes: Valhalla when OCI geo is configured, otherwise OSRM.
 * A timeout, network error, 401, 5xx, or unusable Valhalla body uses OSRM.
 */

import {
  logGeo,
  ociGeoEnvState,
  readOciGeoConfig,
  shouldFallback,
} from "@/lib/api-clients/oci-geo";
import { fetchOsrmRoute } from "@/lib/api-clients/osrm";
import type { ProvidedRoadRoute } from "@/lib/api-clients/road-route";
import {
  fetchValhallaRoute,
  type ValhallaCosting,
} from "@/lib/api-clients/valhalla";
import type { Locale } from "@/lib/i18n/locale";

export async function fetchDrivingRoute(
  coords: Array<{ lng: number; lat: number }>,
  costing?: ValhallaCosting,
  locale: Locale = "bg"
): Promise<ProvidedRoadRoute | null> {
  const state = ociGeoEnvState();
  if (state === "ready") {
    const config = readOciGeoConfig();
    if (config) {
      const valhalla = await fetchValhallaRoute(coords, config, costing, locale);
      if (valhalla.ok) {
        logGeo("routing", { provider: "valhalla", outcome: "ok" });
        return { provider: "valhalla", ...valhalla.route };
      }
      if (!shouldFallback(valhalla.outcome)) {
        logGeo("routing", {
          provider: "valhalla",
          outcome: valhalla.outcome,
          fallback: "none",
        });
        return null;
      }
      logGeo("routing", {
        provider: "valhalla",
        outcome: valhalla.outcome,
        fallback: "osrm",
      });
    }
  } else if (state === "incomplete") {
    logGeo("routing", {
      provider: "valhalla",
      outcome: "skipped",
      reason: "incomplete_env",
      fallback: "osrm",
    });
  }

  const osrm = await fetchOsrmRoute(coords);
  if (!osrm) {
    logGeo("routing", { provider: "osrm", outcome: "empty" });
    return null;
  }
  logGeo("routing", { provider: "osrm", outcome: "ok" });
  return { provider: "osrm", ...osrm };
}
