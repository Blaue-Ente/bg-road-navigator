import { NextRequest, NextResponse } from "next/server";
import { requestLocale } from "@/lib/i18n/request-locale";
import { apiError } from "@/lib/api/api-errors";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import {
  deletePlaceFlag,
  listPlaceFlags,
  upsertPlaceFlag,
} from "@/lib/db/place-flags";
import { aggregateFlags, PLACE_FLAG_KINDS, PLACE_FLAG_VALUES } from "@/lib/planner/flag-score";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const FlagSchema = z.object({
  place_id: z.string().trim().min(1).max(80),
  place_kind: z.enum(PLACE_FLAG_KINDS),
  flag: z.enum(PLACE_FLAG_VALUES),
  note: z.string().trim().max(280).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ flags: [], configured: false });
  }
  const ids = (request.nextUrl.searchParams.get("place_id") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 40);
  if (ids.length === 0) {
    return apiError(request, "invalidPlace", "INVALID_PLACE", 400);
  }
  try {
    const rows = await listPlaceFlags(ids);
    const grouped = aggregateFlags(rows, new Date());
    return NextResponse.json({
      configured: true,
      flags: ids.map((id) => ({
        place_id: id,
        weights: grouped.get(id)?.weights ?? {},
        top: grouped.get(id)?.top ?? [],
      })),
    });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `place-flag:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    20,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = FlagSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(request, "invalidFlag", "INVALID_FLAG", 400);
  }
  try {
    const flag = await upsertPlaceFlag({
      placeId: parsed.data.place_id,
      placeKind: parsed.data.place_kind,
      flag: parsed.data.flag,
      note: parsed.data.note ?? null,
      userId: auth.user.id,
    });
    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = z
    .object({
      place_id: z.string().trim().min(1).max(80),
      flag: z.enum(PLACE_FLAG_VALUES),
    })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(request, "invalidFlag", "INVALID_FLAG", 400);
  }
  try {
    await deletePlaceFlag({
      userId: auth.user.id,
      placeId: parsed.data.place_id,
      flag: parsed.data.flag,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toDbResponse(error, requestLocale(request));
  }
}
