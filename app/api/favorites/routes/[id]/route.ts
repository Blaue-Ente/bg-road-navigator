import { NextRequest, NextResponse } from "next/server";
import { requestLocale } from "@/lib/i18n/request-locale";
import { apiError } from "@/lib/api/api-errors";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { deleteFavoriteRoute, updateFavoriteRoute } from "@/lib/db/favorites";
import {
  resolveTripPreferences,
  TripPreferencePatchSchema,
} from "@/lib/planner/preferences";
import { toDbResponse } from "@/lib/server/db-http";

const ParamsSchema = z.object({ id: z.string().uuid() });

const PointSchema = z.object({
  label: z.string().trim().min(1).max(160),
  lng: z.number().finite().min(-25).max(45),
  lat: z.number().finite().min(34).max(72),
});

const PatchSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    origin: PointSchema.optional(),
    destination: PointSchema.optional(),
    preferences: TripPreferencePatchSchema.optional(),
    plan: z.unknown().optional(),
  })
  .refine((value) => Object.values(value).some((v) => v !== undefined));

const PLAN_BYTES = 400_000;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return apiError(request, "invalidId", "INVALID_ID", 400);
  }
  const body = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return apiError(request, "invalidFavoriteRoute", "INVALID_FAVORITE_ROUTE", 400);
  }
  if (
    body.data.plan != null &&
    JSON.stringify(body.data.plan).length > PLAN_BYTES
  ) {
    return apiError(request, "planTooLarge", "PLAN_TOO_LARGE", 400);
  }
  try {
    const route = await updateFavoriteRoute({
      userId: auth.user.id,
      id: params.data.id,
      name: body.data.name,
      origin: body.data.origin,
      destination: body.data.destination,
      preferences: body.data.preferences
        ? resolveTripPreferences(body.data.preferences)
        : undefined,
      plan: body.data.plan,
    });
    if (!route) return apiError(request, "invalidId", "NOT_FOUND", 404);
    return NextResponse.json({ route });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const params = ParamsSchema.safeParse(await context.params);
  if (!params.success) {
    return apiError(request, "invalidId", "INVALID_ID", 400);
  }
  try {
    await deleteFavoriteRoute(auth.user.id, params.data.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
