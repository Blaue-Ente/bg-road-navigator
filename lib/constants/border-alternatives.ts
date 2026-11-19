/**
 * Known alternate border crossings for the same country pair / corridor.
 * Used to suggest quieter crossings when wait times spike.
 */

export const BORDER_ALTERNATIVES: Record<string, string[]> = {
  // BG — RO
  "danube-bridge-vidin": ["danube-bridge-ruse"],
  "danube-bridge-ruse": ["danube-bridge-vidin"],
  // BG — GR
  kulata: ["promachon", "makaza", "ilinden"],
  promachon: ["kulata", "makaza", "ilinden"],
  makaza: ["kulata", "promachon", "ilinden"],
  ilinden: ["kulata", "promachon", "makaza"],
  // BG — TR
  "kapitan-andreevo": ["lesovo", "malko-tarnovo"],
  lesovo: ["kapitan-andreevo", "malko-tarnovo"],
  "malko-tarnovo": ["kapitan-andreevo", "lesovo"],
  // BG — MK
  gyueshevo: ["zlatarevo", "logodazh"],
  zlatarevo: ["gyueshevo", "logodazh"],
  logodazh: ["gyueshevo", "zlatarevo"],
  // BG — RS
  kalotina: ["strezimirovtsi", "oltomantsi"],
  strezimirovtsi: ["kalotina", "oltomantsi"],
  oltomantsi: ["kalotina", "strezimirovtsi"],
  bregovo: ["vrashka-chuka"],
  "vrashka-chuka": ["bregovo"],
  // DE — AT
  suben: ["kiefersfelden"],
  kiefersfelden: ["suben"],
  // AT — HU / RS — HU corridor
  nickelsdorf: ["horgos"],
  horgos: ["nickelsdorf"],
};

/** Wait (cars) above this triggers a stronger “consider alternative” hint. */
export const BORDER_ALT_WAIT_THRESHOLD_MIN = 45;

export function getAlternativeCrossingIds(crossingId: string): string[] {
  return BORDER_ALTERNATIVES[crossingId] ?? [];
}
