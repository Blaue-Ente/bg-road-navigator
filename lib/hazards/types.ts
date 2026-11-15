/** Four labels the plan shows. Weather sits with лоши условия. */
export type RoadHazardKind = "roadworks" | "closed" | "danger" | "conditions";

export interface RoadHazard {
  id: string;
  kind: RoadHazardKind;
  /** Ремонт, Затворен път, Опасност, or Лоши условия. */
  label_bg: string;
  text_bg: string;
  /** Road and kilometre taken from the official comment, when it names them. */
  road_km_bg: string | null;
  valid_until: string | null;
  lng: number;
  lat: number;
}
