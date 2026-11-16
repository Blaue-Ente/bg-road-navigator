import type { MessageCatalog } from "@/lib/i18n/locales/bg";
import { bg } from "@/lib/i18n/locales/bg";

export type DurationUnits = {
  day: string;
  hour: string;
  min: string;
};

export const BG_UNITS: DurationUnits = {
  day: bg.units.day,
  hour: bg.units.hour,
  min: bg.units.min,
};

export function unitsFrom(m: MessageCatalog): DurationUnits {
  return {
    day: m.units.day,
    hour: m.units.hour,
    min: m.units.min,
  };
}