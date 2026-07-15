import type { GeoPoint } from "@/types/route.types";

export interface TrafficFlow {
  roadId: string;
  coordinates: GeoPoint[];
  speed: number;
  freeSpeed: number;
  confidence: number;
}

export interface TrafficIncident {
  id: string;
  type: "accident" | "road_closure" | "construction" | "congestion" | "weather" | "other";
  title: string;
  description: string;
  coords: GeoPoint;
  severity: "minor" | "moderate" | "major" | "critical";
  delay_min: number;
  published_at: string;
  updated_at: string;
}

export interface TrafficFlowResponse {
  flow: TrafficFlow[];
  incidents: TrafficIncident[];
}
