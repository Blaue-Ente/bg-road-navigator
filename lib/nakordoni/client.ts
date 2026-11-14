export interface NakordoniCallResult {
  ok: boolean;
  status: number;
  json: unknown;
}

const DATA_ROOT = "https://nakordoni.eu";

/** One metered GET. Callers pace requests; this function does not retry. */
export async function nakordoniGet(
  path: string,
  fetcher: typeof fetch = fetch
): Promise<NakordoniCallResult> {
  const apiKey = process.env.NAKORDONI_API_KEY?.trim();
  if (!apiKey) return { ok: false, status: 0, json: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetcher(`${DATA_ROOT}${path}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as unknown;
    const bodyOk =
      Boolean(json) &&
      typeof json === "object" &&
      (json as { ok?: boolean }).ok !== false;
    return { ok: response.ok && bodyOk, status: response.status, json };
  } catch {
    return { ok: false, status: 0, json: null };
  } finally {
    clearTimeout(timer);
  }
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
