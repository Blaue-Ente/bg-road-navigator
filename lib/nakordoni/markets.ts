/** BG, RO, MK, GR. Serbian (13), Hungarian (4) and Turkish (14) are off unless the env adds them. */
export const LICENSED_ORIGIN_COUNTRY_IDS = [12, 5, 15, 19] as const;

/**
 * Nakordoni licenses the neighbouring market, not only the Bulgarian origin.
 * A BG→RS or BG→TR checkpoint is a Serbian or Turkish product even when the
 * query origin is 12.
 */
export const CHECKPOINT_MARKETS: Record<
  string,
  { origin: number; destination: number; crossingId: string }
> = {
  id_390: { origin: 12, destination: 13, crossingId: "kalotina" },
  id_484: { origin: 12, destination: 19, crossingId: "kulata" },
  id_384: { origin: 12, destination: 14, crossingId: "kapitan-andreevo" },
  id_289: { origin: 12, destination: 5, crossingId: "danube-bridge-vidin" },
  id_292: { origin: 12, destination: 5, crossingId: "danube-bridge-ruse" },
  id_400: { origin: 12, destination: 15, crossingId: "gyueshevo" },
  id_403: { origin: 12, destination: 15, crossingId: "zlatarevo" },
  id_485: { origin: 19, destination: 12, crossingId: "promachon" },
  id_388: { origin: 12, destination: 14, crossingId: "malko-tarnovo" },
  id_386: { origin: 12, destination: 14, crossingId: "lesovo" },
};

export function licensedMarketIds(
  env: NodeJS.ProcessEnv = process.env
): number[] {
  const raw = env.NAKORDONI_LICENSED_MARKETS?.trim();
  if (!raw) return [...LICENSED_ORIGIN_COUNTRY_IDS];
  const ids = [
    ...new Set(
      raw
        .split(/[^0-9]+/)
        .map((part) => Number(part))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
  return ids.length > 0 ? ids : [...LICENSED_ORIGIN_COUNTRY_IDS];
}

export function isLicensedMarket(
  countryId: number | null | undefined,
  markets: readonly number[] = licensedMarketIds()
): boolean {
  if (countryId == null) return false;
  return markets.includes(countryId);
}

/** Both the origin market and the neighbouring market must be licensed. */
export function isLicensedMarketPair(
  origin: number | null | undefined,
  destination: number | null | undefined,
  markets: readonly number[] = licensedMarketIds()
): boolean {
  return (
    isLicensedMarket(origin, markets) && isLicensedMarket(destination, markets)
  );
}

export function checkpointSides(ppid: string): {
  origin: number;
  destination: number;
  crossingId: string;
} | null {
  return CHECKPOINT_MARKETS[ppid] ?? null;
}

/** Unknown ppids stay eligible; the directory origin check still applies. */
export function isCheckpointLicensed(
  ppid: string,
  markets: readonly number[] = licensedMarketIds()
): boolean {
  const sides = checkpointSides(ppid);
  if (!sides) return true;
  return isLicensedMarketPair(sides.origin, sides.destination, markets);
}

export function isCrossingLicensed(
  crossingId: string,
  markets: readonly number[] = licensedMarketIds()
): boolean {
  const row = Object.values(CHECKPOINT_MARKETS).find(
    (item) => item.crossingId === crossingId
  );
  if (!row) return true;
  return isLicensedMarketPair(row.origin, row.destination, markets);
}
