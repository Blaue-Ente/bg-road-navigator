import {
  boolean,
  doublePrecision,
  integer,
  smallint,
  bigint,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  unique,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { TripPreferences } from "@/lib/planner/preferences";
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
  tripPreferences: jsonb("trip_preferences").$type<TripPreferences | null>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userVehicles = pgTable("user_vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  vehicleType: text("vehicle_type").notNull().default("car"),
  fuelType: text("fuel_type").notNull().default("diesel"),
  tankCapacityLiters: doublePrecision("tank_capacity_liters"),
  evRangeKm: integer("ev_range_km"),
  consumptionPer100: doublePrecision("consumption_per_100"),
  consumptionSource: text("consumption_source").notNull().default("manual"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface StoredChecklistGroup {
  id: string;
  title: string;
  items: Array<{ id: string; title: string; detail: string }>;
}

/** What a trip really cost, kept next to its checklist. */
export interface TripLog {
  odometer_start_km?: number | null;
  odometer_end_km?: number | null;
  expenses?: Array<{
    id: string;
    category: string;
    amount_eur: number;
    note?: string;
  }>;
  /** The estimate made when the plan was saved, to compare the real spending with. */
  estimate?: {
    total_eur: number;
    total_low: number;
    total_high: number;
    lines: Array<{ id: string; country: string | null; eur: number | null }>;
  };
}

/** The checklist of a planned trip, kept in the profile with its ticks. */
export const userChecklists = pgTable(
  "user_checklists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    planKey: text("plan_key").notNull(),
    title: text("title").notNull(),
    destination: text("destination").notNull(),
    departAt: timestamp("depart_at", { withTimezone: true }),
    groups: jsonb("groups").$type<StoredChecklistGroup[]>().notNull(),
    checks: jsonb("checks").$type<Record<string, boolean>>().notNull().default({}),
    tripLog: jsonb("trip_log").$type<TripLog>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("user_checklists_user_plan").on(table.userId, table.planKey)]
);

export const borderWaitReports = pgTable("border_wait_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  crossingId: text("crossing_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),
  minutes: integer("minutes").notNull(),
  fromCountry: text("from_country"),
  toCountry: text("to_country"),
  source: text("source").notNull().default("manual"),
  reliable: boolean("reliable").notNull().default(true),
  startedAt: timestamp("started_at", { withTimezone: true }),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  locale: text("locale").notNull().default("bg"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tripPushQueue = pgTable("trip_push_queue", {
  id: uuid("id").primaryKey().defaultRandom(),
  endpoint: text("endpoint")
    .notNull()
    .references(() => pushSubscriptions.endpoint, { onDelete: "cascade" }),
  tripId: text("trip_id").notNull(),
  sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull().default("/"),
  tag: text("tag").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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

export const nakordoniCache = pgTable("nakordoni_cache", {
  cacheKey: text("cache_key").primaryKey(),
  kind: text("kind").notNull(),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  observedAt: timestamp("observed_at", { withTimezone: true }),
});

export const nakordoniBudget = pgTable("nakordoni_budget", {
  day: text("day").primaryKey(),
  cheapCalls: integer("cheap_calls").notNull().default(0),
  heavyCalls: integer("heavy_calls").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row — coordinates minimum spacing between live Nakordoni HTTP calls. */
export const nakordoniRate = pgTable("nakordoni_rate", {
  id: smallint("id").primaryKey().default(1),
  nextSlotMs: bigint("next_slot_ms", { mode: "number" }).notNull().default(0),
});

export const osmQueryCache = pgTable("osm_query_cache", {
  cacheKey: text("cache_key").primaryKey(),
  kind: text("kind").notNull(),
  payload: jsonb("payload").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const fuelNationalAverages = pgTable(
  "fuel_national_averages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    countryCode: text("country_code").notNull(),
    fuel: text("fuel").notNull(),
    priceEurPerL: doublePrecision("price_eur_per_l").notNull(),
    week: text("week").notNull(),
    source: text("source").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    unique("fuel_national_averages_week").on(
      table.countryCode,
      table.fuel,
      table.week,
      table.source
    ),
  ]
);

export const fuelPriceReports = pgTable("fuel_price_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  stationId: text("station_id").notNull(),
  fuelType: text("fuel_type").notNull(),
  price: doublePrecision("price").notNull(),
  currency: text("currency").notNull().default("EUR"),
  photoUrl: text("photo_url"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  reporterId: text("reporter_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),
});

export const placeFlags = pgTable(
  "place_flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: text("place_id").notNull(),
    placeKind: text("place_kind").notNull(),
    flag: text("flag").notNull(),
    note: text("note"),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("place_flags_user_flag").on(table.placeId, table.userId, table.flag),
  ]
);

export const favoriteRoutes = pgTable("favorite_routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),
  name: text("name").notNull(),
  origin: jsonb("origin").$type<{ label: string; lng: number; lat: number }>().notNull(),
  destination: jsonb("destination")
    .$type<{ label: string; lng: number; lat: number }>()
    .notNull(),
  preferences: jsonb("preferences").$type<TripPreferences>().notNull(),
  plan: jsonb("plan").$type<unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const favoritePlaces = pgTable("favorite_places", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => profiles.userId, { onDelete: "cascade" }),
  placeId: text("place_id"),
  kind: text("kind").notNull(),
  name: text("name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  note: text("note"),
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
