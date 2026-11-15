import { notePhotonSuccess } from "@/lib/api-clients/photon";
import { readPoiConfig } from "@/lib/poi/config";
import {
  failureFromError,
  failureFromStatus,
  logGeo,
  ociFetch,
  readOciGeoConfig,
  type UpstreamFailure,
} from "@/lib/api-clients/oci-geo";

const WARM_TIMEOUT_MS = 8_000;

export interface WarmGeoResult {
  ok: boolean;
  warmed: boolean;
  reason?: "unconfigured";
  valhalla?: "ok" | UpstreamFailure;
  photon?: "ok" | UpstreamFailure;
  poi?: "ok" | "skipped" | UpstreamFailure;
}

/** Valhalla /status plus a one-hit Photon query. The OCI key stays on the server. */
export async function warmOciGeo(): Promise<WarmGeoResult> {
  const config = readOciGeoConfig();
  if (!config) return { ok: true, warmed: false, reason: "unconfigured" };

  const poiConfig = readPoiConfig();
  const [valhalla, photon, poi] = await Promise.all([
    ping(`${config.baseUrl}/valhalla/status`, config.apiKey),
    ping(`${config.baseUrl}/photon/api?q=Sofia&limit=1&lang=bg`, config.apiKey),
    poiConfig
      ? ping(`${poiConfig.baseUrl}/health`, poiConfig.apiKey)
      : Promise.resolve("skipped" as const),
  ]);
  if (photon === "ok") notePhotonSuccess();

  logGeo("routing", { provider: "valhalla", op: "warm", outcome: valhalla });
  logGeo("geocode", { provider: "photon", op: "warm", outcome: photon });

  return {
    ok: valhalla === "ok" && photon === "ok",
    warmed: true,
    valhalla,
    photon,
    poi,
  };
}

async function ping(
  url: string,
  apiKey: string
): Promise<"ok" | UpstreamFailure> {
  try {
    const response = await ociFetch(
      url,
      apiKey,
      { method: "GET", next: { revalidate: 0 } },
      WARM_TIMEOUT_MS
    );
    if (!response.ok || response.status >= 300) {
      return failureFromStatus(response.status);
    }
    await response.text();
    return "ok";
  } catch (error) {
    return failureFromError(error);
  }
}
