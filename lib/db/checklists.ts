import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userChecklists, type StoredChecklistGroup, type TripLog } from "@/lib/db/schema";

export interface ChecklistRow {
  id: string;
  plan_key: string;
  title: string;
  destination: string;
  depart_at: string | null;
  groups: StoredChecklistGroup[];
  checks: Record<string, boolean>;
  trip_log: TripLog | null;
  updated_at: string;
}

function toRow(row: typeof userChecklists.$inferSelect): ChecklistRow {
  return {
    id: row.id,
    plan_key: row.planKey,
    title: row.title,
    destination: row.destination,
    depart_at: row.departAt ? row.departAt.toISOString() : null,
    groups: row.groups,
    checks: row.checks,
    trip_log: row.tripLog ?? null,
    updated_at: row.updatedAt.toISOString(),
  };
}

export async function listChecklists(userId: string): Promise<ChecklistRow[]> {
  const rows = await getDb()
    .select()
    .from(userChecklists)
    .where(eq(userChecklists.userId, userId))
    .orderBy(desc(userChecklists.updatedAt))
    .limit(30);
  return rows.map(toRow);
}

/**
 * One saved checklist per plan: a second save of the same plan keeps what was
 * ticked off and only refreshes the items and the title.
 */
export async function upsertChecklist(input: {
  userId: string;
  planKey: string;
  title: string;
  destination: string;
  departAt: Date | null;
  groups: StoredChecklistGroup[];
  checks: Record<string, boolean>;
  /** The estimate made with this plan; kept next to the real spending. */
  estimate?: TripLog["estimate"];
}): Promise<ChecklistRow> {
  const [row] = await getDb()
    .insert(userChecklists)
    .values({
      userId: input.userId,
      planKey: input.planKey,
      title: input.title,
      destination: input.destination,
      departAt: input.departAt,
      groups: input.groups,
      checks: input.checks,
      tripLog: input.estimate ? { estimate: input.estimate } : null,
    })
    .onConflictDoUpdate({
      target: [userChecklists.userId, userChecklists.planKey],
      set: {
        title: input.title,
        destination: input.destination,
        departAt: input.departAt,
        groups: input.groups,
        // What the driver already ticked stays; new ticks from this save are added.
        checks: sql`${userChecklists.checks} || ${JSON.stringify(input.checks)}::jsonb`,
        // A fresh estimate replaces the old one; the odometer and the expenses stay.
        ...(input.estimate
          ? {
              tripLog: sql`coalesce(${userChecklists.tripLog}, '{}'::jsonb) || ${JSON.stringify({ estimate: input.estimate })}::jsonb`,
            }
          : {}),
        updatedAt: new Date(),
      },
    })
    .returning();
  return toRow(row!);
}

export async function updateChecks(input: {
  userId: string;
  id: string;
  checks?: Record<string, boolean>;
  /** Odometer and expenses; the stored estimate is never overwritten from here. */
  tripLog?: Pick<TripLog, "odometer_start_km" | "odometer_end_km" | "expenses">;
}): Promise<ChecklistRow | null> {
  const [row] = await getDb()
    .update(userChecklists)
    .set({
      ...(input.checks ? { checks: input.checks } : {}),
      ...(input.tripLog
        ? {
            tripLog: sql`coalesce(${userChecklists.tripLog}, '{}'::jsonb) || ${JSON.stringify(input.tripLog)}::jsonb`,
          }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(userChecklists.id, input.id), eq(userChecklists.userId, input.userId)))
    .returning();
  return row ? toRow(row) : null;
}

/** Ticks for the checklist saved for one plan; null when that plan was never saved. */
export async function mergeChecksByPlan(input: {
  userId: string;
  planKey: string;
  checks: Record<string, boolean>;
}): Promise<ChecklistRow | null> {
  const [row] = await getDb()
    .update(userChecklists)
    .set({
      checks: sql`${userChecklists.checks} || ${JSON.stringify(input.checks)}::jsonb`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userChecklists.userId, input.userId),
        eq(userChecklists.planKey, input.planKey)
      )
    )
    .returning();
  return row ? toRow(row) : null;
}

export async function deleteChecklist(input: {
  userId: string;
  id: string;
}): Promise<boolean> {
  const rows = await getDb()
    .delete(userChecklists)
    .where(and(eq(userChecklists.id, input.id), eq(userChecklists.userId, input.userId)))
    .returning({ id: userChecklists.id });
  return rows.length > 0;
}
