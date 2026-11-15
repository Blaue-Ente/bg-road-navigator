/** One injury or fatal accident kept for clustering. Property-only records never enter. */
export type AccidentKind = "fatal" | "serious" | "slight";

export interface AccidentPoint {
  lng: number;
  lat: number;
  year: number;
  kind: AccidentKind;
  country: string;
  source_id: string;
}

export interface Hotspot {
  id: string;
  country: string;
  lng: number;
  lat: number;
  count: number;
  fatal: number;
  serious: number;
  slight: number;
  /** Sum of weights: fatal 3, serious 2, slight 1. */
  severity: number;
  year_from: number;
  year_to: number;
  source_id: string;
}

export interface HotspotFile {
  generated_at: string;
  radius_m: number;
  min_count: number;
  buffer_km: number;
  counts: Record<string, number>;
  notes: string[];
  hotspots: Hotspot[];
}
