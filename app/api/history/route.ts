import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { clearHistory, listHistory, recordHistory } from "@/lib/db/history";
import { ensureProfile } from "@/lib/db/profiles";
import { requestLocale } from "@/lib/i18n/request-locale";
import { TripPreferencePatchSchema, resolveTripPreferences } from "@/lib/planner/preferences";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";

const PointSchema = z.object({
  label: z.string().trim().min(1).max(160),
  lng: z.number().finite().min(-25).max(45),
  lat: z.number().finite().min(34).max(72),
});

const RecordSchema = z.object({
  plan_key: z.string().trim().min(8).max(40),
  name: z.string().trim().min(1).max(120),
  inputs: z.object({
    origin: PointSchema,
    destination: PointSchema,
    via: z.array(PointSchema).max(3),
    preferences: TripPreferencePatchSchema,
    depart_at: z.string().datetime().nullable(),
    return_at: z.string().datetime().nullable(),
    fuel_level: z.number().finite().min(0.05).max(1),
  }),
  summary: z.object({
    distance_km: z.number().finite().min(0).max(30_000),
    duration_min: z.number().finite().min(0).max(60_000),
    total_min: z.number().finite().min(0).max(100_000),
    depart_at: z.string().datetime(),
    arrive_at: z.string().datetime(),
    nights: z.number().int().min(0).max(30),
    stops: z.number().int().min(0).max(80),
    border: z.string().max(160).nullable(),
    cost_total_eur: z.number().finite().nullable(),
    cost_per_person_eur: z.number().finite().nullable(),
  }),
});

/** The driver's last plans, newest first. Without a database the list is empty. */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [], configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    return NextResponse.json({ items: await listHistory(auth.user.id), configured: true });
  } catch (error) {
    const response = toDbResponse(error, requestLocale(request));
    if (response.status === 503) {
      return NextResponse.json({ items: [], configured: false });
    }
    return response;
  }
}

/** Records one generated plan; recording the same plan twice keeps one row. */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `history:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    30,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = RecordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    await recordHistory(auth.user.id, {
      ...parsed.data,
      inputs: {
        ...parsed.data.inputs,
        preferences: resolveTripPreferences(parsed.data.inputs.preferences),
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}

/** Clears the whole history. */
export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    await clearHistory(auth.user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
