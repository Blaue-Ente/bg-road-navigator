import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userChecklists, type StoredChecklistGroup } from "@/lib/db/schema";

export interface ChecklistRow {
  id: string;
  plan_key: string;
  title: string;
  destination: string;
  depart_at: string | null;
  groups: StoredChecklistGroup[];
  checks: Record<string, boolean>;
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
        updatedAt: new Date(),
      },
    })
    .returning();
  return toRow(row!);
}

export async function updateChecks(input: {
  userId: string;
  id: string;
  checks: Record<string, boolean>;
}): Promise<ChecklistRow | null> {
  const [row] = await getDb()
    .update(userChecklists)
    .set({ checks: input.checks, updatedAt: new Date() })
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
