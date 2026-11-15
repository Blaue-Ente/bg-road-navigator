import { readOciGeoConfig } from "@/lib/api-clients/oci-geo";

export interface PoiConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * OCI_POI_BASE_URL when set, otherwise OCI_GEO_BASE_URL + /poi.
 * The key is OCI_GEO_API_KEY, sent only as X-API-Key.
 */
export function readPoiConfig(
  env: NodeJS.ProcessEnv = process.env
): PoiConfig | null {
  const geo = readOciGeoConfig(env);
  const apiKey = geo?.apiKey ?? env.OCI_GEO_API_KEY?.trim();
  if (!apiKey) return null;
  const explicit = parseBase(env.OCI_POI_BASE_URL);
  if (explicit) return { baseUrl: explicit, apiKey };
  const geoBase = parseBase(env.OCI_GEO_BASE_URL);
  if (!geoBase) return null;
  return { baseUrl: `${geoBase}/poi`, apiKey };
}

/** Public Overpass is off unless an operator turns the last-resort flag on. */
export function overpassFallbackEnabled(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const flag = env.POI_OVERPASS_FALLBACK?.trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "yes";
}

function parseBase(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.search || url.hash) return null;
  const path = url.pathname.replace(/\/$/, "");
  return path ? `${url.origin}${path}` : url.origin;
}
