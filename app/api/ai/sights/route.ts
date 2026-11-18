import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { aiConfig } from "@/lib/ai/provider";
import { SightsInputSchema, suggestSights } from "@/lib/ai/sights";
import { reversePlace, searchPlaces } from "@/lib/api-clients/geocoding";
import { weatherPlaceLabel } from "@/lib/planner/weather-place";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";
import { placeSights } from "@/lib/sights/validate";
import type { PlanSight } from "@/lib/sights/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CACHE_TTL_MS = 60 * 60 * 1000;
const CACHE_MAX = 60;
const cache = new Map<string, { sights: PlanSight[]; expiresAt: number }>();

function within<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]).catch(() => null);
}

/**
 * Places worth a stop along a road the driver chose as "interesting". The model
 * suggests well-known sights near towns on the road; each one is looked up on
 * the map and kept only when it exists and lies near the road, so an invented
 * place never reaches the driver. Without a key it answers `available: false`.
 */
export async function POST(request: NextRequest) {
  if (!aiConfig()) {
    return NextResponse.json({ sights: [], available: false });
  }
  const limit = rateLimit(
    `ai-sights:${clientIpFromHeaders(request.headers)}`,
    3,
    60_000
  );
  if (!limit.ok) {
    return NextResponse.json(
      { sights: [], available: true, error: "RATE_LIMITED" },
      { status: 429 }
    );
  }
  const parsed = SightsInputSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const locale = parsed.data.locale;
  const along = await Promise.all(
    parsed.data.along.map(async (point) => {
      const found = await within(
        reversePlace(point.lat, point.lng, { lang: locale }),
        3_500
      );
      return { ...point, town: weatherPlaceLabel(found, null, locale) };
    })
  );
  const input = { ...parsed.data, along };
  const key = createHash("sha256")
    .update(JSON.stringify({ ...input, line: input.line.length }))
    .digest("hex");
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return NextResponse.json({ sights: hit.sights, available: true, cached: true });
  }

  let aiError: string | null = null;
  const suggestions = await suggestSights(input, {
    onError: (message) => (aiError = message),
  });
  if (suggestions.length === 0) {
    return NextResponse.json(
      {
        sights: [],
        available: true,
        error: "AI_FAILED",
        ...(request.nextUrl.searchParams.get("debug") === "1" ? { ai_error: aiError } : {}),
      },
      { status: 502 }
    );
  }
  const sights = await placeSights(
    suggestions,
    input.line,
    input.distance_km,
    input.rest_km,
    async (name, town) => {
      const places = await within(searchPlaces(`${name}, ${town}`, { lang: locale }), 9_000);
      const first = places?.[0];
      return first ? { lat: first.coords.lat, lng: first.coords.lng } : null;
    }
  );
  cache.set(key, { sights, expiresAt: Date.now() + CACHE_TTL_MS });
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return NextResponse.json({ sights, available: true });
}
