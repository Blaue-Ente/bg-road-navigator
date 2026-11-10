import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { ensureProfile } from "@/lib/db/profiles";
import { insertSavedPlace, listSavedPlaces } from "@/lib/db/saved";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const PlacePayloadSchema = z.object({
  coords: z.object({
    lng: z.number().finite().min(-25).max(45),
    lat: z.number().finite().min(34).max(72),
  }),
  address: z.string().trim().max(240).optional(),
  subtitle: z.string().trim().max(240).optional(),
  external_id: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(80).optional(),
  crossing_id: z.string().trim().max(80).optional(),
});

const SavePlaceSchema = z.object({
  label: z.string().trim().min(1).max(160),
  category: z.enum([
    "home",
    "work",
    "favorite",
    "overnight",
    "fuel",
    "ev_charge",
    "border",
    "food",
    "rest",
    "other",
  ]),
  place: PlacePayloadSchema,
});

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ places: [], configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    const places = await listSavedPlaces(
      auth.user.id,
      request.nextUrl.searchParams.get("category") ?? undefined
    );
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
    `place:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    20,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();

  const parsed = SavePlaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Невалидно място", code: "INVALID_SAVED_PLACE" },
      { status: 400 }
    );
  }

  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const place = await insertSavedPlace({
      userId: auth.user.id,
      label: parsed.data.label,
      category: parsed.data.category,
      place: parsed.data.place,
    });
    return NextResponse.json({ place }, { status: 201 });
  } catch (error) {
    return toDbResponse(error);
  }
}
