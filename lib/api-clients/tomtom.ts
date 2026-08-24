/**
 * TomTom Traffic API — incidents (v5) + flow at a point (v4).
 */

const BASE_V4 = "https://api.tomtom.com/traffic/services/4";
const BASE_V5 = "https://api.tomtom.com/traffic/services/5";
const INCIDENT_FIELDS =
  "{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code},delay,from,to,startTime,endTime}}}";

/** TomTom rejects incident queries over 10,000 km². */
const MAX_INCIDENT_BBOX_KM2 = 9_000;

const HOTSPOTS: Array<{ lng: number; lat: number }> = [
  { lng: 23.3219, lat: 42.6977 }, // Sofia
  { lng: 24.7453, lat: 42.1354 }, // Plovdiv
  { lng: 27.9147, lat: 43.2141 }, // Varna
  { lng: 27.4626, lat: 42.5048 }, // Burgas
  { lng: 22.8969, lat: 42.9833 }, // Kalotina
  { lng: 23.7781, lat: 41.3972 }, // Kulata
  { lng: 26.3056, lat: 41.8833 }, // Kapitan Andreevo
];

const TITLE_BG: Record<string, string> = {
  Closed: "Затворено",
  Roadworks: "Пътен ремонт",
  "Stationary traffic": "Застой",
  "Slow traffic": "Бавен трафик",
  "Queuing traffic": "Опашка",
  "Road surface in poor condition": "Лоша настилка",
  Accident: "Катастрофа",
  "Broken down vehicle": "Повреден автомобил",
};

function titleInBg(raw: string): string {
  return TITLE_BG[raw] ?? raw;
}

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

interface TomTomV5Incident {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
  properties?: {
    id?: string;
    iconCategory?: number;
    magnitudeOfDelay?: number;
    delay?: number;
    from?: string;
    to?: string;
    startTime?: string;
    endTime?: string;
    events?: Array<{ description?: string; code?: number }>;
  };
}

function getApiKey(): string | undefined {
  return process.env.TOMTOM_API_KEY?.trim();
}

function bboxAreaKm2(bbox: { w: number; s: number; e: number; n: number }): number {
  const latMid = ((bbox.s + bbox.n) / 2) * (Math.PI / 180);
  const kmLat = Math.abs(bbox.n - bbox.s) * 110.574;
  const kmLng = Math.abs(bbox.e - bbox.w) * 111.32 * Math.cos(latMid);
  return kmLat * kmLng;
}

function bboxContains(
  bbox: { w: number; s: number; e: number; n: number },
  point: { lng: number; lat: number }
): boolean {
  return (
    point.lng >= bbox.w &&
    point.lng <= bbox.e &&
    point.lat >= bbox.s &&
    point.lat <= bbox.n
  );
}

export function incidentQueryBboxes(
  bbox: { w: number; s: number; e: number; n: number }
): Array<{ w: number; s: number; e: number; n: number }> {
  if (bboxAreaKm2(bbox) <= MAX_INCIDENT_BBOX_KM2) return [bbox];

  const pad = 0.35;
  const boxes = HOTSPOTS.filter((spot) => bboxContains(bbox, spot)).map(
    (spot) => ({
      w: spot.lng - pad,
      s: spot.lat - pad,
      e: spot.lng + pad,
      n: spot.lat + pad,
    })
  );

  if (boxes.length === 0) {
    const midLng = (bbox.w + bbox.e) / 2;
    const midLat = (bbox.s + bbox.n) / 2;
    boxes.push({
      w: midLng - pad,
      s: midLat - pad,
      e: midLng + pad,
      n: midLat + pad,
    });
  }

  return boxes;
}

export function mapIconCategory(
  iconCategory: number | undefined
): TrafficIncident["type"] {
  switch (iconCategory) {
    case 1:
      return "accident";
    case 6:
      return "congestion";
    case 7:
    case 8:
      return "road_closure";
    case 9:
      return "construction";
    case 2:
    case 3:
    case 4:
    case 5:
    case 10:
    case 11:
      return "weather";
    default:
      return "other";
  }
}

export function mapMagnitude(
  magnitude: number | undefined
): TrafficIncident["severity"] {
  if (magnitude === 2) return "moderate";
  if (magnitude === 3) return "major";
  if (magnitude === 4) return "critical";
  return "minor";
}

function firstCoordinate(geometry: TomTomV5Incident["geometry"]): {
  lng: number;
  lat: number;
} | null {
  const coords = geometry?.coordinates;
  if (!coords) return null;

  const walk = (value: unknown): { lng: number; lat: number } | null => {
    if (!Array.isArray(value) || value.length === 0) return null;
    if (typeof value[0] === "number" && typeof value[1] === "number") {
      return { lng: value[0], lat: value[1] };
    }
    return walk(value[0]);
  };

  return walk(coords);
}

export function mapTomTomIncident(
  incident: TomTomV5Incident
): TrafficIncident | null {
  const properties = incident.properties ?? {};
  const coords = firstCoordinate(incident.geometry);
  if (!coords) return null;

  const event = properties.events?.[0];
  const rawTitle =
    event?.description ||
    [properties.from, properties.to].filter(Boolean).join(" → ") ||
    "Пътен инцидент";
  const title = titleInBg(rawTitle);

  return {
    id: properties.id ?? `${coords.lng},${coords.lat}`,
    type: mapIconCategory(properties.iconCategory),
    title,
    description: properties.to
      ? `${properties.from ?? ""} → ${properties.to}`.trim()
      : title,
    coords,
    severity: mapMagnitude(properties.magnitudeOfDelay),
    delayMin: properties.delay ? Math.round(properties.delay / 60) : 0,
    publishedAt: properties.startTime ?? new Date().toISOString(),
    updatedAt: properties.endTime ?? properties.startTime ?? new Date().toISOString(),
  };
}

async function fetchIncidentBox(
  apiKey: string,
  bbox: { w: number; s: number; e: number; n: number }
): Promise<TrafficIncident[]> {
  const params = new URLSearchParams({
    key: apiKey,
    bbox: `${bbox.w},${bbox.s},${bbox.e},${bbox.n}`,
    fields: INCIDENT_FIELDS,
    language: "en-GB",
    timeValidityFilter: "present",
  });

  const response = await fetch(`${BASE_V5}/incidentDetails?${params}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 90 },
  });

  if (!response.ok) {
    console.error(`TomTom incidents ${response.status}`);
    return [];
  }

  const data = (await response.json()) as { incidents?: TomTomV5Incident[] };
  return (data.incidents ?? [])
    .map(mapTomTomIncident)
    .filter((incident): incident is TrafficIncident => Boolean(incident));
}

export async function getTrafficFlow(
  bbox: { w: number; s: number; e: number; n: number } | null,
  zoom: number
): Promise<TrafficFlow[]> {
  void zoom;
  const apiKey = getApiKey();
  if (!apiKey || !bbox) return [];

  const point = { lat: (bbox.s + bbox.n) / 2, lng: (bbox.w + bbox.e) / 2 };
  const params = new URLSearchParams({
    key: apiKey,
    point: `${point.lat},${point.lng}`,
  });

  try {
    const response = await fetch(
      `${BASE_V4}/flowSegmentData/absolute/10/json?${params}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 60 } }
    );
    if (!response.ok) return [];

    const data = (await response.json()) as {
      flowSegmentData?: {
        currentSpeed?: number;
        freeFlowSpeed?: number;
        confidence?: number;
        coordinates?: { coordinate?: Array<{ latitude: number; longitude: number }> };
      };
    };
    const segment = data.flowSegmentData;
    if (!segment) return [];

    return [
      {
        roadId: "center",
        coordinates: (segment.coordinates?.coordinate ?? []).map((c) => ({
          lng: c.longitude,
          lat: c.latitude,
        })),
        speed: segment.currentSpeed ?? 0,
        freeSpeed: segment.freeFlowSpeed ?? 0,
        confidence: segment.confidence ?? 0,
      },
    ];
  } catch (error) {
    console.error("TomTom traffic flow error:", error);
    return [];
  }
}

export async function getTrafficIncidents(
  bbox: { w: number; s: number; e: number; n: number } | null
): Promise<TrafficIncident[]> {
  const apiKey = getApiKey();
  if (!apiKey || !bbox) return [];

  try {
    const boxes = incidentQueryBboxes(bbox);
    const batches = await Promise.all(
      boxes.map((box) => fetchIncidentBox(apiKey, box))
    );
    const seen = new Set<string>();
    return batches.flat().filter((incident) => {
      if (seen.has(incident.id)) return false;
      seen.add(incident.id);
      return true;
    });
  } catch (error) {
    console.error("TomTom incidents error:", error);
    return [];
  }
}
