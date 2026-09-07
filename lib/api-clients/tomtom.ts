/**
 * TomTom Traffic API Client
 * Uses server-side API key to fetch traffic flow and incidents
 */

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;
const BASE_URL = "https://api.tomtom.com/traffic/services/4";

export interface TrafficFlow {
  roadId: string;
  coordinates: Array<{ lng: number; lat: number }>;
  speed: number;
  freeSpeed: number;
  confidence: number;
}

export interface TrafficIncident {
  id: string;
  type:
    | "accident"
    | "road_closure"
    | "construction"
    | "congestion"
    | "weather"
    | "other";
  title: string;
  description: string;
  coords: { lng: number; lat: number };
  severity: "minor" | "moderate" | "major" | "critical";
  delayMin: number;
  publishedAt: string;
  updatedAt: string;
}

interface TomTomCoordinate {
  longitude?: number;
  latitude?: number;
}

interface TomTomFlowSegment {
  roadId?: string;
  coordinates?: { coordinate?: TomTomCoordinate[] };
  currentSpeed?: {
    freeFlowSpeed?: number;
    currentSpeed?: number;
    confidence?: number;
  };
}

interface TomTomIncidentRaw {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  longitude?: number;
  latitude?: number;
  severity?: string;
  delaySeconds?: number;
  incidentDate?: string;
  lastUpdated?: string;
}

export async function getTrafficFlow(
  bbox: { w: number; s: number; e: number; n: number } | null
): Promise<TrafficFlow[]> {
  if (!TOMTOM_API_KEY) {
    console.warn("TOMTOM_API_KEY not configured");
    return [];
  }

  if (!bbox) {
    return [];
  }

  try {
    const url = `${BASE_URL}/flowSegmentData/absolute/10/json?key=${TOMTOM_API_KEY}&bbox=${bbox.w},${bbox.s},${bbox.e},${bbox.n}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TomTom API returned ${response.status}`);
    }

    const data = (await response.json()) as {
      flowSegmentData?: TomTomFlowSegment[];
    };
    return (data.flowSegmentData ?? []).map((segment) => ({
      roadId: segment.roadId ?? "unknown",
      coordinates:
        segment.coordinates?.coordinate?.map((c) => ({
          lng: c.longitude ?? 0,
          lat: c.latitude ?? 0,
        })) ?? [],
      speed:
        segment.currentSpeed?.currentSpeed ??
        segment.currentSpeed?.freeFlowSpeed ??
        0,
      freeSpeed: segment.currentSpeed?.freeFlowSpeed ?? 0,
      confidence: segment.currentSpeed?.confidence ?? 0,
    }));
  } catch (error) {
    console.error("TomTom traffic flow error:", error);
    return [];
  }
}

export async function getTrafficIncidents(
  bbox: { w: number; s: number; e: number; n: number } | null
): Promise<TrafficIncident[]> {
  if (!TOMTOM_API_KEY) {
    return [];
  }

  if (!bbox) {
    return [];
  }

  try {
    // TomTom Traffic Incident Details API
    const url = `${BASE_URL}/incidentDetails/json?key=${TOMTOM_API_KEY}&bbox=${bbox.w},${bbox.s},${bbox.e},${bbox.n}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TomTom API returned ${response.status}`);
    }

    const data = (await response.json()) as { incidents?: TomTomIncidentRaw[] };
    return (data.incidents ?? []).map((incident) => ({
      id: incident.id ?? "unknown",
      type: mapIncidentType(incident.type),
      title: incident.title ?? "Без име",
      description: incident.description ?? "",
      coords: {
        lng: incident.longitude ?? 0,
        lat: incident.latitude ?? 0,
      },
      severity: mapSeverity(incident.severity),
      delayMin: incident.delaySeconds
        ? Math.floor(incident.delaySeconds / 60)
        : 0,
      publishedAt: incident.incidentDate ?? "",
      updatedAt: incident.lastUpdated ?? "",
    }));
  } catch (error) {
    console.error("TomTom incidents error:", error);
    return [];
  }
}

function mapIncidentType(type: string | undefined): TrafficIncident["type"] {
  const typeMap: Record<string, TrafficIncident["type"]> = {
    Accident: "accident",
    RoadClosure: "road_closure",
    Construction: "construction",
    Congestion: "congestion",
    Weather: "weather",
  };
  return typeMap[type ?? ""] ?? "other";
}

function mapSeverity(
  severity: string | undefined
): TrafficIncident["severity"] {
  const severityMap: Record<string, TrafficIncident["severity"]> = {
    Minor: "minor",
    Moderate: "moderate",
    Major: "major",
    Critical: "critical",
  };
  return severityMap[severity ?? ""] ?? "minor";
}
