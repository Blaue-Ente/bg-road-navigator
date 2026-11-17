import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { aiConfig } from "@/lib/ai/provider";
import { TripNotesInputSchema, tripNotes } from "@/lib/ai/trip-notes";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { text: string; expiresAt: number }>();

/**
 * A few sentences on why the planned trip suits the driver, written by an
 * OpenAI-compatible model from the plan's own facts. Without a configured key
 * it answers `available: false` and the page keeps its rule-based text.
 */
export async function POST(request: NextRequest) {
  if (!aiConfig()) {
    return NextResponse.json({ text: null, available: false });
  }
  const limit = rateLimit(
    `ai-trip-notes:${clientIpFromHeaders(request.headers)}`,
    5,
    60_000
  );
  if (!limit.ok) {
    return NextResponse.json({ text: null, available: true, error: "RATE_LIMITED" }, { status: 429 });
  }
  const parsed = TripNotesInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const key = createHash("sha256")
    .update(JSON.stringify(parsed.data))
    .digest("hex");
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json({ text: hit.text, available: true, cached: true });
  }
  const text = await tripNotes(parsed.data);
  if (!text) {
    return NextResponse.json({ text: null, available: true, error: "AI_FAILED" }, { status: 502 });
  }
  cache.set(key, { text, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return NextResponse.json({ text, available: true });
}
