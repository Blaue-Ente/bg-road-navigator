import { NAKORDONI_DATA_ROOT } from "@/lib/api-clients/nakordoni";

/**
 * Nakordoni's own account endpoint: what is left of the limits and which
 * countries the key may query. The docs say it is not metered and limited to
 * 30 calls a minute per key, so reading it never spends quota.
 */
export const NAKORDONI_USAGE_PATH = "/api/v2/account/usage";

export interface AccountUsageResult {
  configured: boolean;
  ok: boolean;
  status: number | null;
  /** The provider's answer with anything key-like removed. */
  usage: unknown;
  checked_at: string;
}

const SECRET_KEY = /key|token|secret|authorization|password/i;

/** Copy of a JSON value without any field whose name looks like a credential. */
export function stripSecrets(value: unknown, depth = 0): unknown {
  if (depth > 6) return null;
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => stripSecrets(v, depth + 1));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(k)) continue;
      out[k] = stripSecrets(v, depth + 1);
    }
    return out;
  }
  if (typeof value === "string") return value.slice(0, 300);
  return value;
}

export async function fetchAccountUsage(
  apiKey: string | undefined,
  fetcher: typeof fetch = fetch,
  now: Date = new Date()
): Promise<AccountUsageResult> {
  const checked_at = now.toISOString();
  if (!apiKey) {
    return { configured: false, ok: false, status: null, usage: null, checked_at };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetcher(`${NAKORDONI_DATA_ROOT}${NAKORDONI_USAGE_PATH}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await response.json().catch(() => null)) as unknown;
    return {
      configured: true,
      ok: response.ok,
      status: response.status,
      usage: stripSecrets(json),
      checked_at,
    };
  } catch {
    return { configured: true, ok: false, status: null, usage: null, checked_at };
  } finally {
    clearTimeout(timer);
  }
}
