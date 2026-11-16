/**
 * Toggleable map overlays. Parking uses curated rest areas.
 */

import type { Localized } from "@/lib/i18n/localized-field";

export type LayerKey =
  | "traffic"
  | "fuel"
  | "ev"
  | "community"
  | "borders"
  | "rest"
  | "cameras"
  | "hotspots";

export interface MapLayer {
  key: LayerKey;
  label_bg: string;
  label: Localized;
  visible: boolean;
  toggleable: boolean;
}

export const MAP_LAYERS: MapLayer[] = [
  {
    key: "traffic",
    label_bg: "Инциденти",
    label: {
      bg: "Инциденти",
      en: "Incidents",
      tr: "Olaylar",
      ro: "Incidente",
    },
    visible: false,
    toggleable: true,
  },
  {
    key: "hotspots",
    label_bg: "Повишено внимание",
    label: {
      bg: "Повишено внимание",
      en: "Accident-prone sections",
      tr: "Kaza riski yüksek kesimler",
      ro: "Sectoare cu risc de accidente",
    },
    visible: true,
    toggleable: true,
  },
  {
    key: "community",
    label_bg: "Общност",
    label: {
      bg: "Общност",
      en: "Community",
      tr: "Topluluk",
      ro: "Comunitate",
    },
    visible: true,
    toggleable: true,
  },
  {
    key: "borders",
    label_bg: "Граници",
    label: {
      bg: "Граници",
      en: "Borders",
      tr: "Sınır kapıları",
      ro: "Frontiere",
    },
    visible: false,
    toggleable: true,
  },
  {
    key: "fuel",
    label_bg: "Бензиностанции",
    label: {
      bg: "Бензиностанции",
      en: "Fuel stations",
      tr: "Akaryakıt istasyonları",
      ro: "Benzinării",
    },
    visible: false,
    toggleable: true,
  },
  {
    key: "ev",
    label_bg: "EV зарядни",
    label: {
      bg: "EV зарядни",
      en: "EV chargers",
      tr: "Şarj istasyonları",
      ro: "Stații de încărcare",
    },
    visible: false,
    toggleable: true,
  },
  {
    key: "rest",
    label_bg: "Почивки",
    label: {
      bg: "Почивки",
      en: "Rest stops",
      tr: "Dinlenme yerleri",
      ro: "Locuri de odihnă",
    },
    visible: false,
    toggleable: true,
  },
  {
    key: "cameras",
    label_bg: "Камери",
    label: {
      bg: "Камери",
      en: "Cameras",
      tr: "Kameralar",
      ro: "Camere",
    },
    visible: false,
    toggleable: true,
  },
];

export const DEFAULT_LAYER_VISIBILITY: Record<LayerKey, boolean> = {
  traffic: false,
  community: true,
  borders: false,
  fuel: false,
  ev: false,
  rest: false,
  cameras: false,
  hotspots: true,
};