import { NAKORDONI_BY_CROSSING } from "@/lib/constants/nakordoni-checkpoints";
import { isCheckpointLicensed } from "@/lib/nakordoni/markets";
import { isLicensedCheckpointOrigin } from "@/lib/planner/nakordoni-budget";

/**
 * Corridor checkpoints already used by the borders page.
 * Both sides of the crossing must be in NAKORDONI_LICENSED_MARKETS.
 * Serbia (13) and Turkey (14) stay out of the default BG/RO/MK/GR set.
 */
const ORIGIN_BY_CROSSING: Record<string, number> = {
  kalotina: 12,
  kulata: 12,
  "kapitan-andreevo": 12,
  "danube-bridge-vidin": 12,
  "danube-bridge-ruse": 12,
  gyueshevo: 12,
  zlatarevo: 12,
  promachon: 19,
  "malko-tarnovo": 12,
  lesovo: 12,
};

export interface CorridorCheckpoint {
  crossingId: string;
  ppid: string;
  originCountryId: number;
}

export const BORDER_V4_PAIRS = [
  { origin: 12, destination: 5, crossingType: 4 },
  { origin: 12, destination: 13, crossingType: 4 },
  { origin: 12, destination: 14, crossingType: 4 },
  { origin: 12, destination: 15, crossingType: 4 },
  { origin: 12, destination: 19, crossingType: 4 },
] as const;

export const DIRECTORY_COUNTRIES = [12, 5, 15, 19] as const;

export function corridorCheckpoints(): CorridorCheckpoint[] {
  const rows: CorridorCheckpoint[] = [];
  for (const [crossingId, entry] of Object.entries(NAKORDONI_BY_CROSSING)) {
    const originCountryId = ORIGIN_BY_CROSSING[crossingId] ?? 12;
    if (!isCheckpointLicensed(entry.ppid)) continue;
    if (!isLicensedCheckpointOrigin(originCountryId)) continue;
    rows.push({ crossingId, ppid: entry.ppid, originCountryId });
  }
  rows.sort((a, b) => a.ppid.localeCompare(b.ppid));
  return rows;
}

export function filterLicensedPpids(
  ppids: string[],
  origins: Array<{ ppid: string; origin: number | null }>
): string[] {
  const byPpid = new Map(origins.map((row) => [row.ppid, row.origin]));
  return ppids.filter((ppid) => {
    if (!isCheckpointLicensed(ppid)) return false;
    if (!byPpid.has(ppid)) return true;
    return isLicensedCheckpointOrigin(byPpid.get(ppid));
  });
}
