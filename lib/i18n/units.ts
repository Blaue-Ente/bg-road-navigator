import type { MessageCatalog } from "@/lib/i18n/locales/bg";

export type DurationUnits = {
  day: string;
  hour: string;
  min: string;
};

export const BG_UNITS: DurationUnits = {
  day: "д",
  hour: "ч",
  min: "мин",
};

export function unitsFrom(m: MessageCatalog): DurationUnits {
  return {
    day: m.units.day,
    hour: m.units.hour,
    min: m.units.min,
  };
}