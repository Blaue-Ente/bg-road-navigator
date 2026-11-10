import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import {
  COMMUNITY_PIN_CATEGORY_IDS,
  communityPinLabel,
} from "@/lib/constants/community-pins";
import { isDatabaseConfigured } from "@/lib/db";
import { createPin, listPins } from "@/lib/db/community";
import { ensureProfile } from "@/lib/db/profiles";
import { rateLimitedResponse, toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const PinSchema = z.object({
  category: z.enum(COMMUNITY_PIN_CATEGORY_IDS),
  title: z.string().trim().min(2).max(160).optional(),
  text: z.string().trim().max(1_000).nullable().optional(),
  description: z.string().trim().max(1_000).nullable().optional(),
  photo_url: z.string().url().max(500).nullable().optional(),
  coords: z.object({
    lng: z.number().finite().min(-25).max(45),
    lat: z.number().finite().min(34).max(72),
  }),
});

const BboxSchema = z.object({
  west: z.coerce.number().finite().min(-25).max(45),
  south: z.coerce.number().finite().min(34).max(72),
  east: z.coerce.number().finite().min(-25).max(45),
  north: z.coerce.number().finite().min(34).max(72),
});

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ pins: [], configured: false });
  }

  const bboxParsed = BboxSchema.safeParse({
    west: request.nextUrl.searchParams.get("west") ?? undefined,
    south: request.nextUrl.searchParams.get("south") ?? undefined,
    east: request.nextUrl.searchParams.get("east") ?? undefined,
    north: request.nextUrl.searchParams.get("north") ?? undefined,
  });
  const category = request.nextUrl.searchParams.get("category");
  const categoryOk = COMMUNITY_PIN_CATEGORY_IDS.includes(
    category as (typeof COMMUNITY_PIN_CATEGORY_IDS)[number]
  );

  try {
    const pins = await listPins({
      ...(bboxParsed.success ? bboxParsed.data : {}),
      ...(categoryOk
        ? { category: category as (typeof COMMUNITY_PIN_CATEGORY_IDS)[number] }
        : {}),
    });
    return NextResponse.json({
      pins,
      configured: true,
      bbox: bboxParsed.success ? bboxParsed.data : null,
    });
  } catch (error) {
    const response = toDbResponse(error);
    if (response.status === 503) {
      return NextResponse.json({ pins: [], configured: false });
    }
    return response;
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limit = rateLimit(
    `pin:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    12,
    60_000
  );
  if (!limit.ok) return rateLimitedResponse();

  const parsed = PinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Невалиден сигнал", code: "INVALID_PIN" },
      { status: 400 }
    );
  }

  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const pin = await createPin({
      userId: auth.user.id,
      category: parsed.data.category,
      title: parsed.data.title?.trim() || communityPinLabel(parsed.data.category),
      text: parsed.data.text ?? parsed.data.description ?? null,
      lat: parsed.data.coords.lat,
      lng: parsed.data.coords.lng,
      photoUrl: parsed.data.photo_url ?? null,
    });
    return NextResponse.json({ pin }, { status: 201 });
  } catch (error) {
    return toDbResponse(error);
  }
}
