import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/db";
import { cancelTripSchedule, replaceTripSchedule } from "@/lib/db/push";
import { buildPushSchedule, TripPushPlanSchema } from "@/lib/push/schedule";
import { vapidConfigured } from "@/lib/push/send";
import { toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const Start = z.object({
  endpoint: z.string().url().max(600),
  trip_id: z.string().min(6).max(64),
  started_at: z.string().datetime(),
  locale: z.enum(["bg", "en", "tr", "ro"]).default("bg"),
  plan: TripPushPlanSchema,
});

const Stop = z.object({
  endpoint: z.string().url().max(600),
  trip_id: z.string().min(6).max(64),
});

/** Plans the trip's notices on the server, so they arrive with the page closed. */
export async function POST(request: NextRequest) {
  if (!vapidConfigured() || !isDatabaseConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        code: vapidConfigured() ? "DATABASE_UNAVAILABLE" : "VAPID_MISSING",
      },
      { status: 503 }
    );
  }
  const limit = rateLimit(
    `push-trip:${clientIpFromHeaders(request.headers)}`,
    10,
    60_000
  );
  if (!limit.ok) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = Start.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    // Only where it went wrong, never the value, so the phone can show what to fix.
    const field = parsed.error.issues[0]?.path.join(".").slice(0, 60) ?? "";
    return NextResponse.json(
      { ok: false, code: "INVALID_PLAN", field },
      { status: 400 }
    );
  }
  const { endpoint, trip_id, started_at, locale, plan } = parsed.data;
  const pushes = buildPushSchedule({
    plan,
    startedAt: new Date(started_at),
    now: new Date(),
    locale,
  });
  try {
    const scheduled = await replaceTripSchedule(endpoint, trip_id, pushes);
    return NextResponse.json({ ok: true, scheduled });
  } catch (error) {
    return toDbResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: true });
  const parsed = Stop.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await cancelTripSchedule(parsed.data.endpoint, parsed.data.trip_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error);
  }
}
