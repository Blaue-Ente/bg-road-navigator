import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";
import {
  borderWaitReports,
  communityPins,
  favoritePlaces,
  favoriteRoutes,
  pinComments,
  placeFlags,
  profiles,
  routeHistory,
  savedPlaces,
  savedRoutes,
  user,
  userChecklists,
  userVehicles,
} from "@/lib/db/schema";

type ByUser = { table: PgTable; column: Parameters<typeof eq>[0] };

const EXPORT_PARTS: Record<string, ByUser> = {
  profile: { table: profiles, column: profiles.userId },
  vehicles: { table: userVehicles, column: userVehicles.userId },
  favorite_routes: { table: favoriteRoutes, column: favoriteRoutes.userId },
  favorite_places: { table: favoritePlaces, column: favoritePlaces.userId },
  saved_routes: { table: savedRoutes, column: savedRoutes.userId },
  saved_places: { table: savedPlaces, column: savedPlaces.userId },
  checklists: { table: userChecklists, column: userChecklists.userId },
  route_history: { table: routeHistory, column: routeHistory.userId },
  border_reports: { table: borderWaitReports, column: borderWaitReports.userId },
  place_flags: { table: placeFlags, column: placeFlags.userId },
  community_pins: { table: communityPins, column: communityPins.userId },
  community_comments: { table: pinComments, column: pinComments.userId },
};

/** Everything stored about one driver, as plain JSON. A table that is not set up yet is left out. */
export async function exportAccount(
  userId: string,
  account: { email: string; name: string }
): Promise<Record<string, unknown>> {
  const db = getDb();
  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account,
  };
  for (const [name, part] of Object.entries(EXPORT_PARTS)) {
    try {
      out[name] = await db
        .select()
        .from(part.table as never)
        .where(eq(part.column, userId));
    } catch {
      out[name] = null;
    }
  }
  return out;
}

/**
 * Deletes the account. Planner data, garage, favourites, history and sessions
 * go with it. Community posts stay but lose their author, unless `deletePosts`.
 */
export async function deleteAccount(input: {
  userId: string;
  deletePosts: boolean;
}): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    if (input.deletePosts) {
      await tx.delete(pinComments).where(eq(pinComments.userId, input.userId));
      await tx.delete(communityPins).where(eq(communityPins.userId, input.userId));
    }
    await tx.delete(profiles).where(eq(profiles.userId, input.userId));
    await tx.delete(user).where(eq(user.id, input.userId));
  });
}
