import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured } from "@/lib/db";
import { saveSubscription } from "@/lib/db/push";
import { toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";
import { vapidConfigured } from "@/lib/push/send";

const Schema = z.object({
  endpoint: z.string().url().max(600),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(10).max(100),
  }),
  locale: z.enum(["bg", "en", "tr", "ro"]).default("bg"),
});

/** Remembers a browser's push address so trip notices can reach it later. */
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
    `push-sub:${clientIpFromHeaders(request.headers)}`,
    10,
    60_000
  );
  if (!limit.ok) return NextResponse.json({ ok: false }, { status: 429 });
  const parsed = Schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await saveSubscription({
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      locale: parsed.data.locale,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error);
  }
}
