import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { favoritePlaces, favoriteRoutes } from "@/lib/db/schema";
import type { TripPreferences } from "@/lib/planner/preferences";

export interface FavoriteRouteRow {
  id: string;
  name: string;
  origin: { label: string; lng: number; lat: number };
  destination: { label: string; lng: number; lat: number };
  preferences: TripPreferences;
  plan: unknown;
  created_at: string;
}

export interface FavoritePlaceRow {
  id: string;
  place_id: string | null;
  kind: string;
  name: string;
  lat: number;
  lng: number;
  note: string | null;
  created_at: string;
}

export async function listFavoriteRoutes(userId: string): Promise<FavoriteRouteRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(favoriteRoutes)
    .where(eq(favoriteRoutes.userId, userId))
    .orderBy(desc(favoriteRoutes.createdAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    origin: row.origin,
    destination: row.destination,
    preferences: row.preferences,
    plan: row.plan ?? null,
    created_at: row.createdAt.toISOString(),
  }));
}

export async function insertFavoriteRoute(input: {
  userId: string;
  name: string;
  origin: FavoriteRouteRow["origin"];
  destination: FavoriteRouteRow["destination"];
  preferences: TripPreferences;
  plan: unknown;
}): Promise<FavoriteRouteRow> {
  const db = getDb();
  const [row] = await db
    .insert(favoriteRoutes)
    .values({
      userId: input.userId,
      name: input.name,
      origin: input.origin,
      destination: input.destination,
      preferences: input.preferences,
      plan: input.plan ?? null,
    })
    .returning();
  if (!row) throw new Error("Favorite route insert returned no row");
  return {
    id: row.id,
    name: row.name,
    origin: row.origin,
    destination: row.destination,
    preferences: row.preferences,
    plan: row.plan ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

export async function updateFavoriteRoute(input: {
  userId: string;
  id: string;
  name?: string;
  origin?: FavoriteRouteRow["origin"];
  destination?: FavoriteRouteRow["destination"];
  preferences?: TripPreferences;
  plan?: unknown;
}): Promise<FavoriteRouteRow | null> {
  const db = getDb();
  const set: Partial<typeof favoriteRoutes.$inferInsert> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.origin !== undefined) set.origin = input.origin;
  if (input.destination !== undefined) set.destination = input.destination;
  if (input.preferences !== undefined) set.preferences = input.preferences;
  if (input.plan !== undefined) set.plan = input.plan;
  if (Object.keys(set).length === 0) return null;
  const [row] = await db
    .update(favoriteRoutes)
    .set(set)
    .where(
      and(eq(favoriteRoutes.id, input.id), eq(favoriteRoutes.userId, input.userId))
    )
    .returning();
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    origin: row.origin,
    destination: row.destination,
    preferences: row.preferences,
    plan: row.plan ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

export async function deleteFavoriteRoute(userId: string, id: string) {
  const db = getDb();
  await db
    .delete(favoriteRoutes)
    .where(and(eq(favoriteRoutes.id, id), eq(favoriteRoutes.userId, userId)));
}

export async function listFavoritePlaces(userId: string): Promise<FavoritePlaceRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(favoritePlaces)
    .where(eq(favoritePlaces.userId, userId))
    .orderBy(desc(favoritePlaces.createdAt))
    .limit(100);
  return rows.map(toPlace);
}

export async function insertFavoritePlace(input: {
  userId: string;
  placeId: string | null;
  kind: string;
  name: string;
  lat: number;
  lng: number;
  note: string | null;
}): Promise<FavoritePlaceRow> {
  const db = getDb();
  const [row] = await db
    .insert(favoritePlaces)
    .values({
      userId: input.userId,
      placeId: input.placeId,
      kind: input.kind,
      name: input.name,
      lat: input.lat,
      lng: input.lng,
      note: input.note,
    })
    .returning();
  if (!row) throw new Error("Favorite place insert returned no row");
  return toPlace(row);
}

export async function deleteFavoritePlace(userId: string, id: string) {
  const db = getDb();
  await db
    .delete(favoritePlaces)
    .where(and(eq(favoritePlaces.id, id), eq(favoritePlaces.userId, userId)));
}

function toPlace(row: typeof favoritePlaces.$inferSelect): FavoritePlaceRow {
  return {
    id: row.id,
    place_id: row.placeId,
    kind: row.kind,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    note: row.note,
    created_at: row.createdAt.toISOString(),
  };
}
