import { crossingIdForHatarinfoName, HATARINFO_PAGE_URL } from "@/lib/constants/border-official-links";
import { readOsmCache, writeOsmCache } from "@/lib/nakordoni/cache-store";
import {
  parseHatarinfoHtml,
  type HatarinfoDirection,
  type HatarinfoPanel,
} from "@/lib/borders/hatarinfo-parse";

/** One successful read serves every caller for 15 minutes (~4 requests/hour). */
export const HATARINFO_TTL_MS = 15 * 60 * 1000;

export const HATARINFO_CACHE_KEY = "hatarinfo:rs-hu";

export const HATARINFO_USER_AGENT =
  "BG-Road-Navigator/1.0 (+https://github.com/Blaue-Ente/bg-road-navigator)";

export interface HatarinfoSnapshot {
  fetchedAt: string;
  crossings: Array<HatarinfoPanel & { id: string | null }>;
}

export type HungarySerbiaDirection = "in" | "out";

const memory: { lastAttemptAt: number; lastGood: HatarinfoSnapshot | null } = {
  lastAttemptAt: 0,
  lastGood: null,
};

export function resetHatarinfoForTests() {
  memory.lastAttemptAt = 0;
  memory.lastGood = null;
}

export function hungarySerbiaDirection(
  origin: { lat: number },
  destination: { lat: number }
): HungarySerbiaDirection {
  return destination.lat >= origin.lat ? "in" : "out";
}

export function hatarinfoReading(
  snapshot: HatarinfoSnapshot | null,
  crossingId: string,
  direction: HungarySerbiaDirection
): (HatarinfoDirection & { observedAt: string }) | null {
  const row = snapshot?.crossings.find((crossing) => crossing.id === crossingId);
  const side = row?.[direction];
  if (!row || !side) return null;
  return { ...side, observedAt: snapshot!.fetchedAt };
}

/**
 * Cached indicative waits. A failed fetch keeps the previous good snapshot
 * and does not try again until the 15-minute gap has passed.
 */
export async function loadHatarinfo(now = Date.now()): Promise<HatarinfoSnapshot | null> {
  const cached = await readOsmCache(HATARINFO_CACHE_KEY, now);
  if (isSnapshot(cached)) {
    memory.lastGood = cached;
    return cached;
  }
  if (now - memory.lastAttemptAt < HATARINFO_TTL_MS) return memory.lastGood;
  memory.lastAttemptAt = now;
  try {
    const response = await fetch(HATARINFO_PAGE_URL, {
      headers: {
        Accept: "text/html",
        "User-Agent": HATARINFO_USER_AGENT,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return memory.lastGood;
    const html = await response.text();
    const panels = parseHatarinfoHtml(html);
    if (panels.length === 0) return memory.lastGood;
    const snapshot: HatarinfoSnapshot = {
      fetchedAt: new Date(now).toISOString(),
      crossings: panels.map((panel) => ({
        ...panel,
        id: crossingIdForHatarinfoName(panel.name),
      })),
    };
    memory.lastGood = snapshot;
    await writeOsmCache({
      key: HATARINFO_CACHE_KEY,
      kind: "hatarinfo",
      payload: snapshot,
      ttlMs: HATARINFO_TTL_MS,
      now: new Date(now),
    });
    return snapshot;
  } catch {
    return memory.lastGood;
  }
}

function isSnapshot(value: unknown): value is HatarinfoSnapshot {
  if (!value || typeof value !== "object") return false;
  const row = value as HatarinfoSnapshot;
  return typeof row.fetchedAt === "string" && Array.isArray(row.crossings);
}
