import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { placeFlags } from "@/lib/db/schema";

export interface PlaceFlagRow {
  id: string;
  place_id: string;
  place_kind: string;
  flag: string;
  note: string | null;
  user_id: string;
  created_at: string;
}

export async function upsertPlaceFlag(input: {
  placeId: string;
  placeKind: string;
  flag: string;
  note: string | null;
  userId: string;
}): Promise<PlaceFlagRow> {
  const db = getDb();
  const [row] = await db
    .insert(placeFlags)
    .values({
      placeId: input.placeId,
      placeKind: input.placeKind,
      flag: input.flag,
      note: input.note,
      userId: input.userId,
    })
    .onConflictDoUpdate({
      target: [placeFlags.placeId, placeFlags.userId, placeFlags.flag],
      set: { note: input.note, createdAt: new Date() },
    })
    .returning();
  if (!row) throw new Error("Place flag insert returned no row");
  return toFlag(row);
}

export async function deletePlaceFlag(input: {
  userId: string;
  placeId: string;
  flag: string;
}): Promise<void> {
  const db = getDb();
  await db
    .delete(placeFlags)
    .where(
      and(
        eq(placeFlags.userId, input.userId),
        eq(placeFlags.placeId, input.placeId),
        eq(placeFlags.flag, input.flag)
      )
    );
}

export async function listPlaceFlags(placeIds: string[]) {
  if (placeIds.length === 0) return [];
  const db = getDb();
  const rows = await db
    .select()
    .from(placeFlags)
    .where(inArray(placeFlags.placeId, placeIds.slice(0, 300)));
  return rows.map((row) => ({
    placeId: row.placeId,
    flag: row.flag,
    createdAt: row.createdAt,
  }));
}

function toFlag(row: typeof placeFlags.$inferSelect): PlaceFlagRow {
  return {
    id: row.id,
    place_id: row.placeId,
    place_kind: row.placeKind,
    flag: row.flag,
    note: row.note,
    user_id: row.userId,
    created_at: row.createdAt.toISOString(),
  };
}
