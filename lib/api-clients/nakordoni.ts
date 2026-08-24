/**
 * Nakordoni.eu Border Queue API
 * Free Explorer tier: 1,000 calls/day — https://nakordoni.eu/en/developers
 *
 * Live `/multi` payload (2026):
 * { ok: true, data: { id_390: { queue: { wait_min, queue_now, wait_status, updated_at } } } }
 */

import {
  getNakordoniPpid,
  NAKORDONI_BY_CROSSING,
  NAKORDONI_PPIDS,
} from "@/lib/constants/nakordoni-checkpoints";

const BASE_URL = "https://nakordoni.eu/api/v1/data";

interface NakordoniQueueBlock {
  found?: boolean;
  queue_now?: number;
  wait_min?: number;
  wait_status?: string;
  updated_at?: string;
}

interface NakordoniCrossingPayload {
  ppid?: string;
  queue?: NakordoniQueueBlock;
  snapshot?: NakordoniQueueBlock;
  wait_min?: number;
  queue_now?: number;
}

interface NakordoniMultiResponse {
  ok: boolean;
  data?:
    | NakordoniCrossingPayload[]
    | { items?: NakordoniCrossingPayload[] }
    | Record<string, NakordoniCrossingPayload>;
}

interface NakordoniQueueResponse {
  ok: boolean;
  data?: NakordoniCrossingPayload;
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

export function extractQueueWait(item: NakordoniCrossingPayload | undefined): {
  waitMinutes: number;
  queueLength: number;
  status?: string;
  updatedAt?: string;
} {
  if (!item) return { waitMinutes: 0, queueLength: 0 };

  const block = item.queue ?? item.snapshot;
  return {
    waitMinutes: Math.round(block?.wait_min ?? item.wait_min ?? 0),
    queueLength: Math.round(
      block?.queue_now ?? item.queue_now ?? 0
    ),
    status: block?.wait_status,
    updatedAt: block?.updated_at,
  };
}

function parseNakordoniTime(value?: string): string {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(
    value.includes("T") ? value : value.replace(" ", "T")
  );
  return Number.isNaN(parsed)
    ? new Date().toISOString()
    : new Date(parsed).toISOString();
}

export function normalizeNakordoniMultiData(
  data: NakordoniMultiResponse["data"]
): Array<{ ppid: string; item: NakordoniCrossingPayload }> {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data
      .filter((item) => item.ppid)
      .map((item) => ({ ppid: item.ppid as string, item }));
  }

  if ("items" in data && Array.isArray(data.items)) {
    return data.items
      .filter((item) => item.ppid)
      .map((item) => ({ ppid: item.ppid as string, item }));
  }

  return Object.entries(data)
    .filter(([ppid, item]) => ppid.startsWith("id_") && item && typeof item === "object")
    .map(([ppid, item]) => ({
      ppid,
      item: item as NakordoniCrossingPayload,
    }));
}

export async function fetchNakordoniQueues(): Promise<NakordoniQueueData[]> {
  const ppids = NAKORDONI_PPIDS.join(",");
  const payload = await nakordoniFetch<NakordoniMultiResponse>(
    `/multi?ppids=${ppids}&include=queue&lang=bg`
  );

  if (!payload?.ok || !payload.data) return [];

  const crossingByPpid = Object.fromEntries(
    Object.entries(NAKORDONI_BY_CROSSING).map(([id, cfg]) => [cfg.ppid, id])
  );

  return normalizeNakordoniMultiData(payload.data).map(({ ppid, item }) => {
    const wait = extractQueueWait(item);
    return {
      ppid,
      crossingId: crossingByPpid[ppid] ?? ppid,
      waitMinutes: wait.waitMinutes,
      queueLength: wait.queueLength,
      status: wait.status,
      updatedAt: parseNakordoniTime(wait.updatedAt),
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

  const wait = extractQueueWait(payload.data);

  return {
    ppid,
    crossingId,
    waitMinutes: wait.waitMinutes,
    queueLength: wait.queueLength,
    updatedAt: parseNakordoniTime(wait.updatedAt),
  };
}
