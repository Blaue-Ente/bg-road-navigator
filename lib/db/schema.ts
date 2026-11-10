import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  unique,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { SavedPlacePayload } from "@/types/place.types";

/**
 * Better Auth tables. Column names stay camelCase because the built-in
 * Kysely adapter writes "emailVerified", "userId", and the other field names
 * as quoted identifiers.
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  homeCity: text("home_city"),
  usualCountry: text("usual_country"),
  car: text("car"),
  avatarUrl: text("avatar_url"),
  vehicleType: text("vehicle_type").notNull().default("car"),
  fuelType: text("fuel_type").notNull().default("diesel"),
  tankCapacityLiters: doublePrecision("tank_capacity_liters"),
  evRangeKm: integer("ev_range_km"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedPlaces = pgTable("saved_places", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),
  label: text("label").notNull(),
  category: text("category").notNull(),
  place: jsonb("place").$type<SavedPlacePayload>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const savedRoutes = pgTable("saved_routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originLabel: text("origin_label").notNull(),
  originCoords: jsonb("origin_coords").$type<{ lng: number; lat: number }>().notNull(),
  destinationLabel: text("destination_label").notNull(),
  destinationCoords: jsonb("destination_coords")
    .$type<{ lng: number; lat: number }>()
    .notNull(),
  waypoints: jsonb("waypoints").$type<unknown[]>().notNull().default([]),
  routeGeojson: jsonb("route_geojson").$type<GeoJSON.LineString | null>(),
  distanceKm: doublePrecision("distance_km"),
  durationMin: integer("duration_min"),
  vehicleType: text("vehicle_type").notNull().default("car"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const communityPinCategory = pgEnum("community_pin_category", [
  "traffic_jam",
  "accident",
  "border_queue",
  "rest_stop",
  "shortcut",
  "hotel",
  "place_to_visit",
  "police",
  "road_works",
  "other",
]);

export const communityPins = pgTable("community_pins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => profiles.userId, {
    onDelete: "set null",
  }),
  category: communityPinCategory("category").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  photoUrl: text("photo_url"),
  upvotes: integer("upvotes").notNull().default(0),
  goneCount: integer("gone_count").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  hiddenAt: timestamp("hidden_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pinVoteKind = pgEnum("pin_vote_kind", ["still_there", "gone"]);

export const pinVotes = pgTable(
  "community_pin_votes",
  {
    pinId: uuid("pin_id")
      .notNull()
      .references(() => communityPins.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    kind: pinVoteKind("kind").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.pinId, table.userId] })]
);

export const pinComments = pgTable("pin_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  pinId: uuid("pin_id")
    .notNull()
    .references(() => communityPins.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => profiles.userId, {
    onDelete: "set null",
  }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pinReports = pgTable(
  "community_pin_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pinId: uuid("pin_id")
      .notNull()
      .references(() => communityPins.id, { onDelete: "cascade" }),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("community_pin_reports_pin_reporter").on(table.pinId, table.reporterId)]
);
