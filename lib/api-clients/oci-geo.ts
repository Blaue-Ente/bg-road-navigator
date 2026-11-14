/**
 * Self-hosted Valhalla + Photon on Oracle.
 * Both OCI_GEO_BASE_URL and OCI_GEO_API_KEY are required.
 * The key is sent only as `X-API-Key` from the server. Never log it.
 */

export const VALHALLA_TIMEOUT_MS = 6_000;
export const PHOTON_TIMEOUT_MS = 4_000;

export type OciGeoEnvState = "ready" | "absent" | "incomplete";

export interface OciGeoConfig {
  baseUrl: string;
  apiKey: string;
}

export type UpstreamFailure =
  "timeout" | "network" | "unauthorized" | "server" | "client" | "empty";

const MIN_SECRET_LENGTH = 8;

export function ociGeoEnvState(
  env: NodeJS.ProcessEnv = process.env
): OciGeoEnvState {
  const hasBase = Boolean(env.OCI_GEO_BASE_URL?.trim());
  const hasKey = Boolean(env.OCI_GEO_API_KEY?.trim());
  if (!hasBase && !hasKey) return "absent";
  return readOciGeoConfig(env) ? "ready" : "incomplete";
}

/** Null unless both variables are set and the base URL is a plain http(s) origin. */
export function readOciGeoConfig(
  env: NodeJS.ProcessEnv = process.env
): OciGeoConfig | null {
  const apiKey = env.OCI_GEO_API_KEY?.trim();
  const baseUrl = parseBaseUrl(env.OCI_GEO_BASE_URL);
  if (!apiKey || !baseUrl) return null;
  return { baseUrl, apiKey };
}

function parseBaseUrl(raw: string | undefined): string | null {
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

/**
 * OCI did not return a usable payload. Public OSRM / Nominatim stay the safety net,
 * including 400s, so a self-hosted rejection does not become a straight-line guess.
 */
/** Every OCI miss falls back. The public service is the safety net, not an error page. */
export function shouldFallback(failure: UpstreamFailure): boolean {
  switch (failure) {
    case "timeout":
    case "network":
    case "unauthorized":
    case "server":
    case "client":
    case "empty":
      return true;
  }
}

export function failureFromStatus(status: number): UpstreamFailure {
  if (status === 401 || status === 403) return "unauthorized";
  if (status >= 500 || status === 408 || status === 429) return "server";
  if (status >= 300) return "client";
  return "empty";
}

export function failureFromError(error: unknown): "timeout" | "network" {
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  return "network";
}

export function logGeo(
  channel: "routing" | "geocode",
  fields: Record<string, string | number>
): void {
  const parts = Object.entries(fields).map(([key, value]) => `${key}=${value}`);
  let line = `[${channel}] ${parts.join(" ")}`;
  const secret = process.env.OCI_GEO_API_KEY?.trim();
  if (secret && secret.length >= MIN_SECRET_LENGTH && line.includes(secret)) {
    line = line.split(secret).join("[redacted]");
  }
  console.info(line);
}

export async function ociFetch(
  url: string,
  apiKey: string,
  init: RequestInit & { next?: { revalidate?: number } },
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("X-API-Key", apiKey);
  try {
    return await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
      redirect: "manual",
    });
  } finally {
    clearTimeout(timeout);
  }
}
