import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/types/profile.types";

function toProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.userId,
    username: row.displayName,
    display_name: row.displayName,
    home_city: row.homeCity,
    usual_country: row.usualCountry,
    car: row.car,
    avatar_url: row.avatarUrl,
    vehicle_type: row.vehicleType as Profile["vehicle_type"],
    fuel_type: row.fuelType as Profile["fuel_type"],
    tank_capacity_liters: row.tankCapacityLiters,
    ev_range_km: row.evRangeKm,
  };
}

export async function ensureProfile(input: {
  userId: string;
  displayName?: string | null;
  email?: string | null;
}): Promise<Profile> {
  const db = getDb();
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, input.userId))
    .limit(1);
  if (existing[0]) return toProfile(existing[0]);

  const fromEmail = input.email?.split("@")[0]?.slice(0, 40);
  const displayName =
    input.displayName?.trim() || fromEmail || "Шофьор";

  const [created] = await db
    .insert(profiles)
    .values({
      userId: input.userId,
      displayName: displayName.slice(0, 40),
    })
    .onConflictDoNothing()
    .returning();

  if (created) return toProfile(created);
  const again = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, input.userId))
    .limit(1);
  if (!again[0]) throw new Error("Profile was not created");
  return toProfile(again[0]);
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return rows[0] ? toProfile(rows[0]) : null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<{
    displayName: string;
    homeCity: string | null;
    usualCountry: string | null;
    car: string | null;
    avatarUrl: string | null;
    vehicleType: string;
    fuelType: string;
    tankCapacityLiters: number | null;
    evRangeKm: number | null;
  }>
): Promise<Profile | null> {
  const db = getDb();
  const [row] = await db
    .update(profiles)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(profiles.userId, userId))
    .returning();
  return row ? toProfile(row) : null;
}
