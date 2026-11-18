import { and, desc, eq, notInArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  routeHistory,
  type HistoryInputs,
  type HistorySummary,
} from "@/lib/db/schema";
import { HISTORY_KEEP, type HistoryEntryInput } from "@/lib/history/entry";

export interface HistoryRow {
  id: string;
  plan_key: string;
  name: string;
  inputs: HistoryInputs;
  summary: HistorySummary;
  created_at: string;
}

function toRow(row: typeof routeHistory.$inferSelect): HistoryRow {
  return {
    id: row.id,
    plan_key: row.planKey,
    name: row.name,
    inputs: row.inputs,
    summary: row.summary,
    created_at: row.createdAt.toISOString(),
  };
}

export async function listHistory(userId: string): Promise<HistoryRow[]> {
  const rows = await getDb()
    .select()
    .from(routeHistory)
    .where(eq(routeHistory.userId, userId))
    .orderBy(desc(routeHistory.createdAt))
    .limit(HISTORY_KEEP);
  return rows.map(toRow);
}

/** Records one plan (once per plan) and drops what is older than the newest 30. */
export async function recordHistory(userId: string, entry: HistoryEntryInput): Promise<void> {
  const db = getDb();
  await db
    .insert(routeHistory)
    .values({
      userId,
      planKey: entry.plan_key,
      name: entry.name,
      inputs: entry.inputs,
      summary: entry.summary,
    })
    .onConflictDoNothing({ target: [routeHistory.userId, routeHistory.planKey] });
  const keep = await db
    .select({ id: routeHistory.id })
    .from(routeHistory)
    .where(eq(routeHistory.userId, userId))
    .orderBy(desc(routeHistory.createdAt))
    .limit(HISTORY_KEEP);
  if (keep.length < HISTORY_KEEP) return;
  await db
    .delete(routeHistory)
    .where(
      and(
        eq(routeHistory.userId, userId),
        notInArray(
          routeHistory.id,
          keep.map((row) => row.id)
        )
      )
    );
}

export async function deleteHistory(userId: string, id: string): Promise<void> {
  await getDb()
    .delete(routeHistory)
    .where(and(eq(routeHistory.id, id), eq(routeHistory.userId, userId)));
}

export async function clearHistory(userId: string): Promise<void> {
  await getDb().delete(routeHistory).where(eq(routeHistory.userId, userId));
}

