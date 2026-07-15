/**
 * Nakordoni.eu checkpoint mapping for Bulgarian border crossings
 * @see https://nakordoni.eu/en/developers
 */

export interface NakordoniCheckpoint {
  ppid: string;
  pagePath: string;
}

/** Cars queue entering Bulgaria (or departing BG — most relevant for travelers) */
export const NAKORDONI_BY_CROSSING: Record<string, NakordoniCheckpoint> = {
  kalotina: { ppid: "id_390", pagePath: "/en/id/id_390" },
  kulata: { ppid: "id_484", pagePath: "/en/id/id_484" },
  "kapitan-andreevo": { ppid: "id_384", pagePath: "/en/id/id_384" },
  "danube-bridge-vidin": { ppid: "id_289", pagePath: "/en/id/id_289" },
  "danube-bridge-ruse": { ppid: "id_292", pagePath: "/en/id/id_292" },
  gyueshevo: { ppid: "id_400", pagePath: "/en/id/id_400" },
  zlatarevo: { ppid: "id_403", pagePath: "/en/id/id_403" },
  promachon: { ppid: "id_485", pagePath: "/en/id/id_485" },
  "malko-tarnovo": { ppid: "id_388", pagePath: "/en/id/id_388" },
  lesovo: { ppid: "id_386", pagePath: "/en/id/id_386" },
};

export const NAKORDONI_BASE_URL = "https://nakordoni.eu";

export function getNakordoniPageUrl(crossingId: string): string | null {
  const entry = NAKORDONI_BY_CROSSING[crossingId];
  if (!entry) return null;
  return `${NAKORDONI_BASE_URL}${entry.pagePath}`;
}

export function getNakordoniPpid(crossingId: string): string | null {
  return NAKORDONI_BY_CROSSING[crossingId]?.ppid ?? null;
}

export const NAKORDONI_PPIDS = Object.values(NAKORDONI_BY_CROSSING).map(
  (c) => c.ppid
);
