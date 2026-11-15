import type { GeoPoint } from "@/types/route.types";

const PAD_DEG = 0.12;
const INCIDENT_URL =
  "https://api.tomtom.com/traffic/services/4/incidentDetails/json";

/**
 * Highest TomTom incident delay inside a small box around a crossing.
 * Határinfó supplies the queue for Serbia–Hungary. This delay stays beside it.
 * AMSS is not fetched.
 */
export async function trafficDelayNearBorder(input: {
  coords: GeoPoint;
  apiKey?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<number | null> {
  const apiKey = input.apiKey?.trim();
  if (!apiKey) return null;
  const { lng, lat } = input.coords;
  const bbox = [lng - PAD_DEG, lat - PAD_DEG, lng + PAD_DEG, lat + PAD_DEG].join(
    ","
  );
  const url = `${INCIDENT_URL}?key=${encodeURIComponent(apiKey)}&bbox=${encodeURIComponent(bbox)}`;
  try {
    const response = await (input.fetchImpl ?? fetch)(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      incidents?: Array<{ delaySeconds?: number }>;
    };
    return maxTrafficDelayMin(body.incidents ?? []);
  } catch {
    return null;
  }
}

export function maxTrafficDelayMin(
  incidents: Array<{ delaySeconds?: number | null; delayMin?: number | null }>
): number | null {
  let best = 0;
  for (const incident of incidents) {
    const minutes =
      incident.delayMin ??
      (incident.delaySeconds != null
        ? Math.floor(incident.delaySeconds / 60)
        : 0);
    if (minutes > best) best = minutes;
  }
  return best > 0 ? Math.round(best) : null;
}
