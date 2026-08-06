import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthedSupabase } from "@/lib/supabase/api-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const ProfileUpdateSchema = z.object({
  username: z.string().trim().min(2).max(40).optional(),
  vehicle_type: z.enum(["car", "ev", "truck", "motorcycle"]).optional(),
  fuel_type: z.enum(["diesel", "petrol", "lpg", "electric"]).optional(),
  tank_capacity_liters: z
    .number()
    .finite()
    .min(10)
    .max(500)
    .nullable()
    .optional(),
  ev_range_km: z.number().int().min(50).max(2000).nullable().optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
});

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ profile: null, configured: false });
  }

  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("profiles")
    .select(
      "id, username, avatar_url, vehicle_type, fuel_type, tank_capacity_liters, ev_range_km"
    )
    .eq("id", auth.user.id)
    .maybeSingle();

  if (error) {
    console.error("Profile load error:", error);
    return NextResponse.json(
      { error: "Unable to load profile", code: "PROFILE_LOAD_FAILED" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: data, configured: true });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthedSupabase();
  if (!auth.ok) return auth.response;

  const parsed = ProfileUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid profile update", code: "INVALID_PROFILE" },
      { status: 400 }
    );
  }

  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined)
  );

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No fields to update", code: "EMPTY_UPDATE" },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(updates)
    .eq("id", auth.user.id)
    .select(
      "id, username, avatar_url, vehicle_type, fuel_type, tank_capacity_liters, ev_range_km"
    )
    .single();

  if (error) {
    console.error("Profile update error:", error);
    const conflict = error.code === "23505";
    return NextResponse.json(
      {
        error: conflict ? "Username already taken" : "Unable to update profile",
        code: conflict ? "USERNAME_TAKEN" : "PROFILE_UPDATE_FAILED",
      },
      { status: conflict ? 409 : 500 }
    );
  }

  return NextResponse.json({ profile: data });
}
