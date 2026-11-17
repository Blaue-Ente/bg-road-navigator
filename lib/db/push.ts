import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pushSubscriptions, tripPushQueue } from "@/lib/db/schema";
import type { ScheduledPush } from "@/lib/push/schedule";

const MAX_PENDING_PER_ENDPOINT = 60;

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  locale: string;
}

export async function saveSubscription(input: PushSubscriptionInput) {
  await getDb()
    .insert(pushSubscriptions)
    .values(input)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { p256dh: input.p256dh, auth: input.auth, locale: input.locale },
    });
}

/** Replaces the unsent pushes of one trip with a fresh schedule. */
export async function replaceTripSchedule(
  endpoint: string,
  tripId: string,
  pushes: ScheduledPush[]
): Promise<number> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx
      .delete(tripPushQueue)
      .where(
        and(
          eq(tripPushQueue.endpoint, endpoint),
          eq(tripPushQueue.tripId, tripId),
          isNull(tripPushQueue.sentAt)
        )
      );
    const [{ count }] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(tripPushQueue)
      .where(and(eq(tripPushQueue.endpoint, endpoint), isNull(tripPushQueue.sentAt)));
    const room = Math.max(0, MAX_PENDING_PER_ENDPOINT - Number(count));
    const rows = pushes.slice(0, room).map((push) => ({
      endpoint,
      tripId,
      sendAt: push.sendAt,
      title: push.title,
      body: push.body,
      tag: push.tag,
      url: push.url ?? "/",
    }));
    if (rows.length > 0) await tx.insert(tripPushQueue).values(rows);
    return rows.length;
  });
}

export async function cancelTripSchedule(endpoint: string, tripId: string) {
  await getDb()
    .delete(tripPushQueue)
    .where(
      and(
        eq(tripPushQueue.endpoint, endpoint),
        eq(tripPushQueue.tripId, tripId),
        isNull(tripPushQueue.sentAt)
      )
    );
}

export interface DuePush {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  url: string;
  tag: string;
}

export async function duePushes(now: Date, limit = 100): Promise<DuePush[]> {
  const rows = await getDb()
    .select({
      id: tripPushQueue.id,
      endpoint: tripPushQueue.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
      title: tripPushQueue.title,
      body: tripPushQueue.body,
      url: tripPushQueue.url,
      tag: tripPushQueue.tag,
    })
    .from(tripPushQueue)
    .innerJoin(
      pushSubscriptions,
      eq(pushSubscriptions.endpoint, tripPushQueue.endpoint)
    )
    .where(and(isNull(tripPushQueue.sentAt), lte(tripPushQueue.sendAt, now)))
    .limit(limit);
  return rows;
}

export async function markSent(ids: string[], now: Date) {
  if (ids.length === 0) return;
  const db = getDb();
  for (const id of ids) {
    await db
      .update(tripPushQueue)
      .set({ sentAt: now })
      .where(eq(tripPushQueue.id, id));
  }
}

export async function dropSubscription(endpoint: string) {
  await getDb()
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint));
}

/** Old sent rows are not needed. */
export async function pruneSent(before: Date) {
  await getDb()
    .delete(tripPushQueue)
    .where(and(lte(tripPushQueue.sentAt, before)));
}
