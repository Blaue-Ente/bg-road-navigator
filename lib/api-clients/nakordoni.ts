/**
 * Nakordoni.eu Border Queue API
 * Free Explorer tier: 1,000 calls/day — https://nakordoni.eu/en/developers
 */

import {
  getNakordoniPpid,
  NAKORDONI_BY_CROSSING,
  NAKORDONI_PPIDS,
} from "@/lib/constants/nakordoni-checkpoints";

const BASE_URL = "https://nakordoni.eu/api/v1/data";

interface NakordoniQueueSnapshot {
  queue_now?: number;
  wait_min?: number;
  wait_status?: string;
  trend?: string;
}

interface NakordoniQueueResponse {
  ok: boolean;
  data?: {
    ppid?: string;
    snapshot?: NakordoniQueueSnapshot;
    queue_now?: number;
    wait_min?: number;
  };
}

interface NakordoniMultiItem {
  ppid: string;
  snapshot?: NakordoniQueueSnapshot;
  queue_now?: number;
  wait_min?: number;
}

interface NakordoniMultiResponse {
  ok: boolean;
  data?: NakordoniMultiItem[] | { items?: NakordoniMultiItem[] };
}

export interface NakordoniQueueData {
  ppid: string;
  crossingId: string;
  waitMinutes: number;
  queueLength: number;
  status?: string;
  updatedAt: string;
}

function getApiKey(): string | undefined {
  return process.env.NAKORDONI_API_KEY;
}

async function nakordoniFetch<T>(path: string): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      next: { revalidate: 120 },
    });

    if (!response.ok) {
      console.error(`Nakordoni API ${path}: ${response.status}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("Nakordoni API error:", error);
    return null;
  }
}

function extractWait(item: NakordoniMultiItem | NakordoniQueueResponse["data"]) {
  if (!item) return { waitMinutes: 0, queueLength: 0, status: undefined };

  const snapshot = "snapshot" in item ? item.snapshot : undefined;
  const waitMinutes = Math.round(
    snapshot?.wait_min ?? item.wait_min ?? 0
  );
  const queueLength = Math.round(
    snapshot?.queue_now ?? ("queue_now" in item ? item.queue_now : 0) ?? 0
  );

  return {
    waitMinutes,
    queueLength,
    status: snapshot?.wait_status,
  };
}

export async function fetchNakordoniQueues(): Promise<NakordoniQueueData[]> {
  const ppids = NAKORDONI_PPIDS.join(",");
  const payload = await nakordoniFetch<NakordoniMultiResponse>(
    `/multi?ppids=${ppids}&include=queue&lang=bg`
  );

  if (!payload?.ok || !payload.data) return [];

  const items = Array.isArray(payload.data)
    ? payload.data
    : payload.data.items ?? [];

  const crossingByPpid = Object.fromEntries(
    Object.entries(NAKORDONI_BY_CROSSING).map(([id, cfg]) => [cfg.ppid, id])
  );

  return items.map((item) => {
    const { waitMinutes, queueLength, status } = extractWait(item);
    return {
      ppid: item.ppid,
      crossingId: crossingByPpid[item.ppid] ?? item.ppid,
      waitMinutes,
      queueLength,
      status,
      updatedAt: new Date().toISOString(),
    };
  });
}

export async function fetchNakordoniQueue(
  crossingId: string
): Promise<NakordoniQueueData | null> {
  const ppid = getNakordoniPpid(crossingId);
  if (!ppid) return null;

  const payload = await nakordoniFetch<NakordoniQueueResponse>(
    `/queue?ppid=${ppid}&lang=bg`
  );

  if (!payload?.ok || !payload.data) return null;

  const { waitMinutes, queueLength, status } = extractWait(payload.data);

  return {
    ppid,
    crossingId,
    waitMinutes,
    queueLength,
    status,
    updatedAt: new Date().toISOString(),
  };
}
