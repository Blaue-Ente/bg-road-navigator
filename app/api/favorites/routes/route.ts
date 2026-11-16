import { NextRequest, NextResponse } from "next/server";
import { requestLocale } from "@/lib/i18n/request-locale";
import { apiError } from "@/lib/api/api-errors";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import {
  insertFavoriteRoute,
  listFavoriteRoutes,
} from "@/lib/db/favorites";
import { ensureProfile } from "@/lib/db/profiles";
import {
  resolveTripPreferences,
  TripPreferencePatchSchema,
} from "@/lib/planner/preferences";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const PointSchema = z.object({
  label: z.string().trim().min(1).max(160),
  lng: z.number().finite().min(-25).max(45),
  lat: z.number().finite().min(34).max(72),
});

const SaveSchema = z.object({
  name: z.string().trim().min(1).max(120),
  origin: PointSchema,
  destination: PointSchema,
  preferences: TripPreferencePatchSchema.optional(),
  plan: z.unknown().optional(),
});

const PLAN_BYTES = 400_000;

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ routes: [], configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    const routes = await listFavoriteRoutes(auth.user.id);
    return NextResponse.json({ routes, configured: true });
  } catch (error) {
    const response = toDbResponse(error, requestLocale(request));
    if (response.status === 503) {
      return NextResponse.json({ routes: [], configured: false });
    }
    return response;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `favorite-route:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    12,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = SaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(request, "invalidFavoriteRoute", "INVALID_FAVORITE_ROUTE", 400);
  }
  const plan = parsed.data.plan ?? null;
  if (plan != null && JSON.stringify(plan).length > PLAN_BYTES) {
    return apiError(request, "planTooLarge", "PLAN_TOO_LARGE", 400);
  }
  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const route = await insertFavoriteRoute({
      userId: auth.user.id,
      name: parsed.data.name,
      origin: parsed.data.origin,
      destination: parsed.data.destination,
      preferences: resolveTripPreferences(parsed.data.preferences),
      plan,
    });
    return NextResponse.json({ route }, { status: 201 });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
