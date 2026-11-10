import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { savedPlaces, savedRoutes } from "@/lib/db/schema";
import type { SavedPlace, SavedPlaceCategory } from "@/types/place.types";
import type { SavedRoute } from "@/types/route.types";

function iso(value: Date): string {
  return value.toISOString();
}

export async function listSavedPlaces(
  userId: string,
  category?: string
): Promise<SavedPlace[]> {
  const db = getDb();
  const filters = [eq(savedPlaces.userId, userId)];
  if (category) filters.push(eq(savedPlaces.category, category));
  const rows = await db
    .select()
    .from(savedPlaces)
    .where(and(...filters))
    .orderBy(desc(savedPlaces.createdAt))
    .limit(100);
  return rows.map((row) => ({
    id: row.id,
    user_id: row.userId,
    label: row.label,
    category: row.category as SavedPlaceCategory,
    place: row.place,
    created_at: iso(row.createdAt),
  }));
}

export async function insertSavedPlace(input: {
  userId: string;
  label: string;
  category: string;
  place: SavedPlace["place"];
}): Promise<SavedPlace> {
  const db = getDb();
  const [row] = await db
    .insert(savedPlaces)
    .values({
      userId: input.userId,
      label: input.label,
      category: input.category,
      place: input.place,
    })
    .returning();
  if (!row) throw new Error("Place insert returned no row");
  return {
    id: row.id,
    user_id: row.userId,
    label: row.label,
    category: row.category as SavedPlaceCategory,
    place: row.place,
    created_at: iso(row.createdAt),
  };
}

export async function deleteSavedPlace(userId: string, id: string) {
  const db = getDb();
  await db
    .delete(savedPlaces)
    .where(and(eq(savedPlaces.id, id), eq(savedPlaces.userId, userId)));
}

export async function listSavedRoutes(userId: string): Promise<SavedRoute[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(savedRoutes)
    .where(eq(savedRoutes.userId, userId))
    .orderBy(desc(savedRoutes.createdAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    user_id: row.userId,
    name: row.name,
    origin_label: row.originLabel,
    origin_coords: row.originCoords,
    destination_label: row.destinationLabel,
    destination_coords: row.destinationCoords,
    waypoints: (row.waypoints ?? []) as SavedRoute["waypoints"],
    route_geojson: row.routeGeojson,
    distance_km: row.distanceKm,
    duration_min: row.durationMin,
    vehicle_type: row.vehicleType as SavedRoute["vehicle_type"],
    created_at: iso(row.createdAt),
  }));
}

export async function insertSavedRoute(input: {
  userId: string;
  name: string;
  originLabel: string;
  originCoords: { lng: number; lat: number };
  destinationLabel: string;
  destinationCoords: { lng: number; lat: number };
  waypoints: unknown[];
  routeGeojson: GeoJSON.LineString | null;
  distanceKm: number | null;
  durationMin: number | null;
  vehicleType: string;
}): Promise<SavedRoute> {
  const db = getDb();
  const [row] = await db.insert(savedRoutes).values(input).returning();
  if (!row) throw new Error("Route insert returned no row");
  return (await listSavedRoutes(input.userId)).find((route) => route.id === row.id)!;
}

export async function deleteSavedRoute(userId: string, id: string) {
  const db = getDb();
  await db
    .delete(savedRoutes)
    .where(and(eq(savedRoutes.id, id), eq(savedRoutes.userId, userId)));
}
