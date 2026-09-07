import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { COMMUNITY_PIN_CATEGORY_IDS } from "@/lib/constants/community-pins";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ensureProfileRow } from "@/lib/supabase/ensure-profile";
import type { CommunityPin } from "@/types/community.types";

const PinSchema = z.object({
  category: z.enum(COMMUNITY_PIN_CATEGORY_IDS),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1_000).nullable().optional(),
  coords: z.object({
    lng: z.number().finite().min(-25).max(45),
    lat: z.number().finite().min(34).max(72),
  }),
  expires_in_hours: z.number().int().min(1).max(168).default(24),
});

const BboxSchema = z.object({
  west: z.coerce.number().finite().min(-25).max(45),
  south: z.coerce.number().finite().min(34).max(72),
  east: z.coerce.number().finite().min(-25).max(45),
  north: z.coerce.number().finite().min(34).max(72),
});

function inBbox(
  pin: CommunityPin,
  bbox: { west: number; south: number; east: number; north: number }
) {
  const { lng, lat } = pin.coords;
  return (
    lng >= bbox.west &&
    lng <= bbox.east &&
    lat >= bbox.south &&
    lat <= bbox.north
  );
}

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ pins: [], configured: false });
  }

  const bboxParsed = BboxSchema.safeParse({
    west: request.nextUrl.searchParams.get("west") ?? undefined,
    south: request.nextUrl.searchParams.get("south") ?? undefined,
    east: request.nextUrl.searchParams.get("east") ?? undefined,
    north: request.nextUrl.searchParams.get("north") ?? undefined,
  });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("community_pins")
    .select("*")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(bboxParsed.success ? 250 : 100);

  if (error) {
    console.error("Community pin list error:", error);
    return NextResponse.json(
      {
        error: "Unable to load community reports",
        code: "COMMUNITY_LOAD_FAILED",
      },
      { status: 500 }
    );
  }

  let pins = (data ?? []) as CommunityPin[];
  if (bboxParsed.success) {
    pins = pins.filter((pin) => inBbox(pin, bboxParsed.data));
  }

  return NextResponse.json({
    pins,
    configured: true,
    bbox: bboxParsed.success ? bboxParsed.data : null,
  });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Community service is not configured",
        code: "COMMUNITY_UNAVAILABLE",
      },
      { status: 503 }
    );
  }

  const parsed = PinSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid community report", code: "INVALID_PIN" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  await ensureProfileRow(supabase, user.id, user.email);

  const expiresAt = new Date(
    Date.now() + parsed.data.expires_in_hours * 60 * 60 * 1000
  ).toISOString();
  const { data, error } = await supabase
    .from("community_pins")
    .insert({
      user_id: user.id,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      coords: parsed.data.coords,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error("Community pin create error:", error);
    return NextResponse.json(
      { error: "Unable to publish report", code: "COMMUNITY_CREATE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ pin: data }, { status: 201 });
}
