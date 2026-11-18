import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { aiConfig } from "@/lib/ai/provider";
import { TripGuideInputSchema, tripGuide, type TripGuide } from "@/lib/ai/trip-guide";
import { reversePlace } from "@/lib/api-clients/geocoding";
import { weatherPlaceLabel } from "@/lib/planner/weather-place";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 100;
const cache = new Map<string, { guide: TripGuide; expiresAt: number }>();

/**
 * Overnight areas and meal ideas for this group, written by the configured
 * model from the plan's own facts. Without a key it answers `available: false`.
 */
export async function POST(request: NextRequest) {
  if (!aiConfig()) {
    return NextResponse.json({ guide: null, available: false });
  }
  const limit = rateLimit(
    `ai-trip-guide:${clientIpFromHeaders(request.headers)}`,
    4,
    60_000
  );
  if (!limit.ok) {
    return NextResponse.json(
      { guide: null, available: true, error: "RATE_LIMITED" },
      { status: 429 }
    );
  }
  const parsed = TripGuideInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  // The town of each overnight stop, so the model names where to sleep and not
  // the filling station the stop may be anchored on.
  const input = {
    ...parsed.data,
    stops: await Promise.all(
      parsed.data.stops.map(async (stop) => {
        if (!stop.kind.includes("overnight") || stop.lat == null || stop.lng == null) {
          return stop;
        }
        const found = await Promise.race([
          reversePlace(stop.lat, stop.lng, { lang: parsed.data.locale }),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3_500)),
        ]).catch(() => null);
        const town = weatherPlaceLabel(found, null, parsed.data.locale);
        return { ...stop, town };
      })
    ),
  };
  const key = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json({ guide: hit.guide, available: true, cached: true });
  }
  let aiError: string | null = null;
  const guide = await tripGuide(input, {
    onError: (message) => (aiError = message),
  });
  if (!guide) {
    return NextResponse.json(
      {
        guide: null,
        available: true,
        error: "AI_FAILED",
        // Status and message only, never the key.
        ...(request.nextUrl.searchParams.get("debug") === "1" ? { ai_error: aiError } : {}),
      },
      { status: 502 }
    );
  }
  cache.set(key, { guide, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return NextResponse.json({ guide, available: true });
}
