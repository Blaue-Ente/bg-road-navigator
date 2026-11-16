import {
  nakordoniMeteredFetch,
  type NakordoniMeteredResult,
} from "@/lib/api-clients/nakordoni";

export interface NakordoniCallResult {
  ok: boolean;
  status: number;
  json: unknown;
}

export type { NakordoniMeteredResult };

/** One metered GET — pacing, dedupe, and 429 handling live in nakordoni.ts. */
export async function nakordoniGet(
  path: string,
  _fetcher: typeof fetch = fetch
): Promise<NakordoniCallResult> {
  void _fetcher;
  const result = await nakordoniMeteredFetch(path);
  return { ok: result.ok, status: result.status, json: result.json };
}

export function nakordoniPath(kind: string, key: string): string | null {
  if (kind === "queue") {
    const ppids = key.slice("queue:".length);
    if (!ppids) return null;
    return `/api/v1/data/multi?ppids=${encodeURIComponent(ppids)}&include=queue,update-info&lang=bg`;
  }
  if (kind === "day-stats") {
    const ppid = key.slice("day-stats:".length);
    return `/api/v1/data/day-stats?ppid=${encodeURIComponent(ppid)}&lang=bg`;
  }
  if (kind === "forecast") {
    const ppid = key.slice("forecast:".length).replace(/:24$/, "");
    return `/api/v1/data/forecast?ppid=${encodeURIComponent(ppid)}&prediction_steps=24`;
  }
  if (kind === "border") {
    const parts = key.split(":");
    if (parts.length !== 4) return null;
    return `/api/v4/data/border/${parts[1]}/${parts[2]}/${parts[3]}`;
  }
  if (kind === "directory") {
    const country = key.slice("directory:".length);
    return `/api/v1/data/checkpoints?country=${encodeURIComponent(country)}&lang=bg`;
  }
  return null;
}