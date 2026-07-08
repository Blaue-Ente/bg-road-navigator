/**
 * BG Road Navigator - Map Layers Configuration
 */

export type LayerKey = 
  | "traffic" 
  | "fuel" 
  | "ev" 
  | "community" 
  | "weather" 
  | "cameras";

export interface MapLayer {
  key: LayerKey;
  label_bg: string;
  visible: boolean;
  toggleable: boolean;
}

export const MAP_LAYERS: MapLayer[] = [
  {
    key: "traffic",
    label_bg: "Пробиви",
    visible: true,
    toggleable: true
  },
  {
    key: "fuel",
    label_bg: "Газови станции",
    visible: false,
    toggleable: true
  },
  {
    key: "ev",
    label_bg: "Електрозарядни станции",
    visible: false,
    toggleable: true
  },
  {
    key: "community",
    label_bg: "Общностни маркери",
    visible: true,
    toggleable: true
  },
  {
    key: "weather",
    label_bg: "Прогноза време",
    visible: false,
    toggleable: true
  },
  {
    key: "cameras",
    label_bg: "Камери",
    visible: false,
    toggleable: true
  }
];

export const DEFAULT_LAYERS: LayerKey[] = ["traffic", "community"];