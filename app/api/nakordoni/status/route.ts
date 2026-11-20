import { NextResponse } from "next/server";
import { cachedValue } from "@/lib/cache/shared-cache";
import { fetchAccountUsage } from "@/lib/nakordoni/account-usage";

/**
 * What Nakordoni says about our key: plan, remaining daily units and the
 * approved countries. It calls the provider's unmetered account endpoint and
 * keeps the answer in memory for ten minutes, so it never spends quota and
 * cannot be used to hammer it. Credential-like fields are removed.
 */
export async function GET() {
  const { value } = await cachedValue({
    key: "nakordoni:account-usage",
    kind: "nakordoni-account",
    ttlMs: 10 * 60 * 1000,
    persist: false,
    load: () => fetchAccountUsage(process.env.NAKORDONI_API_KEY?.trim()),
  });
  return NextResponse.json(value, { headers: { "Cache-Control": "no-store" } });
}
