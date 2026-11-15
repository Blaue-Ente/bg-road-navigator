export const POI_TYPES = [
  "fuel",
  "charging",
  "hotel",
  "restaurant",
  "rest_area",
  "toilets",
  "attraction",
  "viewpoint",
  "playground",
] as const;

export type PoiType = (typeof POI_TYPES)[number];

export const CONTRACT_POI_TYPES = [
  "fuel",
  "charging",
  "hotel",
  "restaurant",
  "rest_area",
  "toilets",
] as const;

export interface PoiItem {
  id: string;
  type: PoiType;
  name: string;
  brand: string | null;
  operator: string | null;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  dist_m: number | null;
  along_m: number | null;
}

export interface PoiCollection {
  items: PoiItem[];
  source: string;
  osm_timestamp: string | null;
}

export interface CorridorPlace {
  id: string;
  name: string;
  brand: string | null;
  lat: number;
  lng: number;
  kind: PoiType;
  motorwayService: boolean;
  tags: Record<string, string>;
  alongM: number | null;
  distM: number | null;
  source: "poi" | "overpass" | "openchargemap";
}
