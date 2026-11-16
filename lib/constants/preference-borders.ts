import {
  BORDER_CROSSINGS,
  type BorderCrossing,
} from "@/lib/constants/border-crossings";
import {
  getCrossingsByIds,
  getAllEuropeanCrossings,
} from "@/lib/constants/european-borders";
import {
  HUNGARY_SERBIA_PLANNER_IDS,
  HU_ROMANIA_PREFERENCE_IDS,
} from "@/lib/constants/border-official-links";

const EXTRA_PREFERENCE_IDS = [
  ...HUNGARY_SERBIA_PLANNER_IDS,
  ...HU_ROMANIA_PREFERENCE_IDS,
] as const;

/** Crossings the driver may prefer or avoid in trip planning (BG + key transit posts). */
export function preferenceBorderCrossings(): BorderCrossing[] {
  const byId = new Map(getAllEuropeanCrossings().map((row) => [row.id, row]));
  const ordered: BorderCrossing[] = [];
  for (const row of BORDER_CROSSINGS) {
    ordered.push(row);
  }
  for (const id of EXTRA_PREFERENCE_IDS) {
    const row = byId.get(id);
    if (row && !ordered.some((item) => item.id === id)) ordered.push(row);
  }
  return ordered;
}

export function preferenceBorderById(id: string): BorderCrossing | null {
  return (
    preferenceBorderCrossings().find((row) => row.id === id) ??
    getCrossingsByIds([id])[0] ??
    null
  );
}