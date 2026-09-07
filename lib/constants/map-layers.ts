/**
 * Toggleable map overlays. Parking uses curated rest areas.
 */

export type LayerKey =
  "traffic" | "fuel" | "ev" | "community" | "borders" | "rest" | "cameras";

export interface MapLayer {
  key: LayerKey;
  label_bg: string;
  visible: boolean;
  toggleable: boolean;
}

export const MAP_LAYERS: MapLayer[] = [
  { key: "traffic", label_bg: "Инциденти", visible: true, toggleable: true },
  { key: "community", label_bg: "Общност", visible: true, toggleable: true },
  { key: "borders", label_bg: "Граници", visible: false, toggleable: true },
  { key: "fuel", label_bg: "Бензиностанции", visible: false, toggleable: true },
  { key: "ev", label_bg: "EV зарядни", visible: false, toggleable: true },
  { key: "rest", label_bg: "Почивки", visible: false, toggleable: true },
  { key: "cameras", label_bg: "Камери", visible: false, toggleable: true },
];

export const DEFAULT_LAYER_VISIBILITY: Record<LayerKey, boolean> = {
  traffic: true,
  community: true,
  borders: false,
  fuel: false,
  ev: false,
  rest: false,
  cameras: false,
};
