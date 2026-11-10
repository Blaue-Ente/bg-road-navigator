import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isDatabaseConfigured } from "@/lib/db";
import { ensureProfile, getProfile, updateProfile } from "@/lib/db/profiles";
import { toDbResponse } from "@/lib/server/db-http";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

const ProfileUpdateSchema = z.object({
  display_name: z.string().trim().min(2).max(40).optional(),
  username: z.string().trim().min(2).max(40).optional(),
  home_city: z.string().trim().max(80).nullable().optional(),
  usual_country: z.string().trim().max(80).nullable().optional(),
  car: z.string().trim().max(80).nullable().optional(),
  vehicle_type: z.enum(["car", "ev", "truck", "motorcycle"]).optional(),
  fuel_type: z.enum(["diesel", "petrol", "lpg", "electric"]).optional(),
  tank_capacity_liters: z.number().finite().min(10).max(500).nullable().optional(),
  ev_range_km: z.number().int().min(50).max(2000).nullable().optional(),
  avatar_url: z.string().url().max(500).nullable().optional(),
});

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ profile: null, configured: false });
  }
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  try {
    const profile = await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    return NextResponse.json({ profile, configured: true });
  } catch (error) {
    return toDbResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const limit = rateLimit(
    `profile:${auth.user.id}:${clientIpFromHeaders(request.headers)}`,
    20,
    60_000
  );
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Твърде много заявки", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  const parsed = ProfileUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Невалиден профил", code: "INVALID_PROFILE" },
      { status: 400 }
    );
  }

  const displayName = parsed.data.display_name ?? parsed.data.username;
  const patch = {
    ...(displayName ? { displayName } : {}),
    ...(parsed.data.home_city !== undefined
      ? { homeCity: parsed.data.home_city }
      : {}),
    ...(parsed.data.usual_country !== undefined
      ? { usualCountry: parsed.data.usual_country }
      : {}),
    ...(parsed.data.car !== undefined ? { car: parsed.data.car } : {}),
    ...(parsed.data.vehicle_type
      ? { vehicleType: parsed.data.vehicle_type }
      : {}),
    ...(parsed.data.fuel_type ? { fuelType: parsed.data.fuel_type } : {}),
    ...(parsed.data.tank_capacity_liters !== undefined
      ? { tankCapacityLiters: parsed.data.tank_capacity_liters }
      : {}),
    ...(parsed.data.ev_range_km !== undefined
      ? { evRangeKm: parsed.data.ev_range_km }
      : {}),
    ...(parsed.data.avatar_url !== undefined
      ? { avatarUrl: parsed.data.avatar_url }
      : {}),
  };

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: "Няма полета за запис", code: "EMPTY_UPDATE" },
      { status: 400 }
    );
  }

  try {
    await ensureProfile({
      userId: auth.user.id,
      displayName: auth.user.name,
      email: auth.user.email,
    });
    const profile = await updateProfile(auth.user.id, patch);
    if (!profile) {
      const current = await getProfile(auth.user.id);
      return NextResponse.json({ profile: current });
    }
    return NextResponse.json({ profile });
  } catch (error) {
    return toDbResponse(error);
  }
}
