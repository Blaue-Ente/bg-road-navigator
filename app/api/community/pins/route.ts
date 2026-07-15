import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PinSchema = z.object({
  category: z.enum([
    "police",
    "accident",
    "hazard",
    "road_works",
    "traffic_jam",
    "fuel_issue",
    "border_info",
    "rest_area",
    "point_of_interest",
    "other",
  ]),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1_000).nullable().optional(),
  coords: z.object({
    lng: z.number().finite().min(-25).max(45),
    lat: z.number().finite().min(34).max(72),
  }),
  expires_in_hours: z.number().int().min(1).max(168).default(24),
});

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ pins: [], configured: false });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("community_pins")
    .select("*")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Community pin list error:", error);
    return NextResponse.json(
      { error: "Unable to load community reports", code: "COMMUNITY_LOAD_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ pins: data, configured: true });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Community service is not configured", code: "COMMUNITY_UNAVAILABLE" },
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
