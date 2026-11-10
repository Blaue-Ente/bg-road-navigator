import { and, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  communityPins,
  pinComments,
  pinReports,
  pinVotes,
} from "@/lib/db/schema";
import {
  isShortLivedPin,
  shortLivedHours,
} from "@/lib/constants/community-pins";
import type { CommunityPin, PinComment } from "@/types/community.types";

const HIDE_AFTER_REPORTS = 3;
const GONE_EXPIRES_AT = 3;

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function toPin(row: typeof communityPins.$inferSelect): CommunityPin {
  return {
    id: row.id,
    user_id: row.userId,
    category: row.category,
    title: row.title,
    description: row.body,
    text: row.body,
    coords: { lng: row.lng, lat: row.lat },
    photo_url: row.photoUrl,
    is_verified: false,
    upvotes: row.upvotes,
    gone_count: row.goneCount,
    expires_at: iso(row.expiresAt),
    created_at: row.createdAt.toISOString(),
  };
}

export async function listPins(filter: {
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  category?: CommunityPin["category"];
}): Promise<CommunityPin[]> {
  const db = getDb();
  const now = new Date();
  const conditions = [
    isNull(communityPins.hiddenAt),
    or(isNull(communityPins.expiresAt), gte(communityPins.expiresAt, now)),
  ];
  if (filter.category) conditions.push(eq(communityPins.category, filter.category));
  if (
    filter.west != null &&
    filter.south != null &&
    filter.east != null &&
    filter.north != null
  ) {
    conditions.push(gte(communityPins.lng, filter.west));
    conditions.push(lte(communityPins.lng, filter.east));
    conditions.push(gte(communityPins.lat, filter.south));
    conditions.push(lte(communityPins.lat, filter.north));
  }
  const rows = await db
    .select()
    .from(communityPins)
    .where(and(...conditions))
    .orderBy(desc(communityPins.createdAt))
    .limit(250);
  return rows.map(toPin);
}

export async function createPin(input: {
  userId: string;
  category: CommunityPin["category"];
  title: string;
  text?: string | null;
  lat: number;
  lng: number;
  photoUrl?: string | null;
}): Promise<CommunityPin> {
  const db = getDb();
  const hours = shortLivedHours(input.category);
  const expiresAt = hours
    ? new Date(Date.now() + hours * 60 * 60 * 1000)
    : null;
  const [row] = await db
    .insert(communityPins)
    .values({
      userId: input.userId,
      category: input.category,
      title: input.title,
      body: input.text ?? null,
      lat: input.lat,
      lng: input.lng,
      photoUrl: input.photoUrl ?? null,
      expiresAt,
    })
    .returning();
  if (!row) throw new Error("Pin insert returned no row");
  return toPin(row);
}

export async function voteOnPin(input: {
  pinId: string;
  userId: string;
  kind: "still_there" | "gone";
}): Promise<{ upvotes: number; gone_count: number } | "missing" | "same"> {
  const db = getDb();
  const [pin] = await db
    .select()
    .from(communityPins)
    .where(eq(communityPins.id, input.pinId))
    .limit(1);
  if (!pin || pin.hiddenAt) return "missing";

  const [existing] = await db
    .select()
    .from(pinVotes)
    .where(and(eq(pinVotes.pinId, input.pinId), eq(pinVotes.userId, input.userId)))
    .limit(1);

  let upvotes = pin.upvotes;
  let gone = pin.goneCount;

  if (!existing) {
    await db.insert(pinVotes).values({
      pinId: input.pinId,
      userId: input.userId,
      kind: input.kind,
    });
    if (input.kind === "still_there") upvotes += 1;
    else gone += 1;
  } else if (existing.kind === input.kind) {
    return "same";
  } else {
    await db
      .update(pinVotes)
      .set({ kind: input.kind })
      .where(and(eq(pinVotes.pinId, input.pinId), eq(pinVotes.userId, input.userId)));
    if (input.kind === "still_there") {
      upvotes += 1;
      gone = Math.max(0, gone - 1);
    } else {
      gone += 1;
      upvotes = Math.max(0, upvotes - 1);
    }
  }

  let expiresAt = pin.expiresAt;
  if (input.kind === "gone" && isShortLivedPin(pin.category) && gone >= GONE_EXPIRES_AT) {
    expiresAt = new Date();
  }

  await db
    .update(communityPins)
    .set({ upvotes, goneCount: gone, expiresAt })
    .where(eq(communityPins.id, input.pinId));

  return { upvotes, gone_count: gone };
}

export async function reportPin(input: {
  pinId: string;
  userId: string;
  reason: string;
}): Promise<"ok" | "missing" | "duplicate"> {
  const db = getDb();
  const [pin] = await db
    .select({ id: communityPins.id })
    .from(communityPins)
    .where(eq(communityPins.id, input.pinId))
    .limit(1);
  if (!pin) return "missing";

  try {
    await db.insert(pinReports).values({
      pinId: input.pinId,
      reporterId: input.userId,
      reason: input.reason,
    });
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "23505") return "duplicate";
    throw error;
  }

  const [counted] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(pinReports)
    .where(eq(pinReports.pinId, input.pinId));
  if ((counted?.n ?? 0) >= HIDE_AFTER_REPORTS) {
    await db
      .update(communityPins)
      .set({ hiddenAt: new Date() })
      .where(eq(communityPins.id, input.pinId));
  }
  return "ok";
}

export async function listComments(pinId: string): Promise<PinComment[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(pinComments)
    .where(eq(pinComments.pinId, pinId))
    .orderBy(pinComments.createdAt)
    .limit(100);
  return rows.map((row) => ({
    id: row.id,
    pin_id: row.pinId,
    user_id: row.userId,
    body: row.body,
    created_at: row.createdAt.toISOString(),
  }));
}

export async function addComment(input: {
  pinId: string;
  userId: string;
  body: string;
}): Promise<PinComment | "missing"> {
  const db = getDb();
  const [pin] = await db
    .select({ id: communityPins.id, hiddenAt: communityPins.hiddenAt })
    .from(communityPins)
    .where(eq(communityPins.id, input.pinId))
    .limit(1);
  if (!pin || pin.hiddenAt) return "missing";
  const [row] = await db
    .insert(pinComments)
    .values({
      pinId: input.pinId,
      userId: input.userId,
      body: input.body,
    })
    .returning();
  if (!row) throw new Error("Comment insert returned no row");
  return {
    id: row.id,
    pin_id: row.pinId,
    user_id: row.userId,
    body: row.body,
    created_at: row.createdAt.toISOString(),
  };
}
