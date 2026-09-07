import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthedSupabase } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ensureProfileRow } from "@/lib/supabase/ensure-profile";

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
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ places: [], configured: false });
  }

  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const category = request.nextUrl.searchParams.get("category");
  let query = auth.supabase
    .from("saved_places")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Saved places list error:", error);
    return NextResponse.json(
      {
        error: "Unable to load saved places",
        code: "SAVED_PLACES_LOAD_FAILED",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ places: data ?? [], configured: true });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const parsed = SavePlaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid saved place", code: "INVALID_SAVED_PLACE" },
      { status: 400 }
    );
  }

  await ensureProfileRow(auth.supabase, auth.user.id, auth.user.email);

  const { data, error } = await auth.supabase
    .from("saved_places")
    .insert({
      user_id: auth.user.id,
      label: parsed.data.label,
      category: parsed.data.category,
      place: parsed.data.place,
    })
    .select()
    .single();

  if (error) {
    console.error("Saved place create error:", error);
    return NextResponse.json(
      { error: "Unable to save place", code: "SAVED_PLACE_CREATE_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ place: data }, { status: 201 });
}
