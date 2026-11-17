import { and, asc, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userVehicles } from "@/lib/db/schema";
import type { UserVehicle, VehicleInput } from "@/lib/vehicles/types";

const MAX_VEHICLES = 12;

function toVehicle(row: typeof userVehicles.$inferSelect): UserVehicle {
  return {
    id: row.id,
    name: row.name,
    vehicle_type: row.vehicleType as UserVehicle["vehicle_type"],
    fuel_type: row.fuelType as UserVehicle["fuel_type"],
    tank_capacity_liters: row.tankCapacityLiters,
    ev_range_km: row.evRangeKm,
    consumption_per_100: row.consumptionPer100,
    consumption_source: row.consumptionSource as UserVehicle["consumption_source"],
    is_active: row.isActive,
  };
}

export async function listVehicles(userId: string): Promise<UserVehicle[]> {
  const rows = await getDb()
    .select()
    .from(userVehicles)
    .where(eq(userVehicles.userId, userId))
    .orderBy(asc(userVehicles.createdAt));
  return rows.map(toVehicle);
}

export async function getVehicle(
  userId: string,
  id: string
): Promise<UserVehicle | null> {
  const rows = await getDb()
    .select()
    .from(userVehicles)
    .where(and(eq(userVehicles.userId, userId), eq(userVehicles.id, id)))
    .limit(1);
  return rows[0] ? toVehicle(rows[0]) : null;
}

export async function getActiveVehicle(
  userId: string
): Promise<UserVehicle | null> {
  const rows = await getDb()
    .select()
    .from(userVehicles)
    .where(and(eq(userVehicles.userId, userId), eq(userVehicles.isActive, true)))
    .limit(1);
  return rows[0] ? toVehicle(rows[0]) : null;
}

export class VehicleLimitError extends Error {
  constructor() {
    super("Too many vehicles");
    this.name = "VehicleLimitError";
  }
}

export async function insertVehicle(
  userId: string,
  input: VehicleInput
): Promise<UserVehicle> {
  const db = getDb();
  const existing = await db
    .select({ id: userVehicles.id, isActive: userVehicles.isActive })
    .from(userVehicles)
    .where(eq(userVehicles.userId, userId));
  if (existing.length >= MAX_VEHICLES) throw new VehicleLimitError();
  // The first car is active at once; later ones only when asked.
  const makeActive = existing.length === 0 || input.is_active === true;
  return db.transaction(async (tx) => {
    if (makeActive) {
      await tx
        .update(userVehicles)
        .set({ isActive: false })
        .where(eq(userVehicles.userId, userId));
    }
    const [row] = await tx
      .insert(userVehicles)
      .values({
        userId,
        name: input.name,
        vehicleType: input.vehicle_type,
        fuelType: input.fuel_type,
        tankCapacityLiters: input.tank_capacity_liters ?? null,
        evRangeKm: input.ev_range_km ?? null,
        consumptionPer100: input.consumption_per_100 ?? null,
        consumptionSource: input.consumption_source,
        isActive: makeActive,
      })
      .returning();
    if (!row) throw new Error("Vehicle insert returned no row");
    return toVehicle(row);
  });
}

export async function updateVehicle(
  userId: string,
  id: string,
  patch: Partial<VehicleInput>
): Promise<UserVehicle | null> {
  const set: Partial<typeof userVehicles.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.vehicle_type !== undefined) set.vehicleType = patch.vehicle_type;
  if (patch.fuel_type !== undefined) set.fuelType = patch.fuel_type;
  if (patch.tank_capacity_liters !== undefined)
    set.tankCapacityLiters = patch.tank_capacity_liters;
  if (patch.ev_range_km !== undefined) set.evRangeKm = patch.ev_range_km;
  if (patch.consumption_per_100 !== undefined)
    set.consumptionPer100 = patch.consumption_per_100;
  if (patch.consumption_source !== undefined)
    set.consumptionSource = patch.consumption_source;
  return getDb().transaction(async (tx) => {
    if (patch.is_active === true) {
      await tx
        .update(userVehicles)
        .set({ isActive: false })
        .where(
          and(eq(userVehicles.userId, userId), ne(userVehicles.id, id))
        );
      set.isActive = true;
    }
    const [row] = await tx
      .update(userVehicles)
      .set(set)
      .where(and(eq(userVehicles.userId, userId), eq(userVehicles.id, id)))
      .returning();
    return row ? toVehicle(row) : null;
  });
}

export async function deleteVehicle(userId: string, id: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [removed] = await tx
      .delete(userVehicles)
      .where(and(eq(userVehicles.userId, userId), eq(userVehicles.id, id)))
      .returning();
    if (!removed?.isActive) return;
    // Keep one car active so the planner always has a default.
    const [next] = await tx
      .select()
      .from(userVehicles)
      .where(eq(userVehicles.userId, userId))
      .orderBy(asc(userVehicles.createdAt))
      .limit(1);
    if (next) {
      await tx
        .update(userVehicles)
        .set({ isActive: true })
        .where(eq(userVehicles.id, next.id));
    }
  });
}
