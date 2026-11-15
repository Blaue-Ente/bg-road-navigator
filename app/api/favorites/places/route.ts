import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { insertFavoritePlace, listFavoritePlaces } from "@/lib/db/favorites";
import { ensureProfile } from "@/lib/db/profiles";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const SaveSchema = z.object({
  place_id: z.string().trim().min(1).max(80).nullable().optional(),
  kind: z.enum(["fuel", "hotel", "restaurant", "rest_area", "custom"]),
  name: z.string().trim().min(1).max(160),
  lat: z.number().finite().min(34).max(72),
  lng: z.number().finite().min(-25).max(45),
  note: z.string().trim().max(280).nullable().optional(),
});

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ places: [], configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    const places = await listFavoritePlaces(auth.user.id);
    return NextResponse.json({ places, configured: true });
  } catch (error) {
    const response = toDbResponse(error);
    if (response.status === 503) {
      return NextResponse.json({ places: [], configured: false });
    }
    return response;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const limit = rateLimit(
    `favorite-place:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    20,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();
  const parsed = SaveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Невалидно любимо място", code: "INVALID_FAVORITE_PLACE" },
      { status: 400 }
    );
  }
  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const place = await insertFavoritePlace({
      userId: auth.user.id,
      placeId: parsed.data.place_id ?? null,
      kind: parsed.data.kind,
      name: parsed.data.name,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      note: parsed.data.note ?? null,
    });
    return NextResponse.json({ place }, { status: 201 });
  } catch (error) {
    return toDbResponse(error);
  }
}
