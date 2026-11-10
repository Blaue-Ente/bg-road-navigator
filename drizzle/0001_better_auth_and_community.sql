-- Better Auth + profiles, saved places/routes, and community.
-- Apply once on the Neon database behind DATABASE_URL.
-- Do not run this from the app. See docs/SETUP.md.

create extension if not exists pgcrypto;

create table if not exists "user" (
  "id" text primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists "session" (
  "id" text primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);

create index if not exists "session_userId_idx" on "session" ("userId");

create table if not exists "account" (
  "id" text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "account_userId_idx" on "account" ("userId");
create unique index if not exists "account_provider_account_idx"
  on "account" ("providerId", "accountId");

create table if not exists "verification" (
  "id" text primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists "verification_identifier_idx"
  on "verification" ("identifier");

create table if not exists profiles (
  user_id text primary key references "user" (id) on delete cascade,
  display_name text not null,
  home_city text,
  usual_country text,
  car text,
  avatar_url text,
  vehicle_type text not null default 'car'
    check (vehicle_type in ('car', 'ev', 'truck', 'motorcycle')),
  fuel_type text not null default 'diesel'
    check (fuel_type in ('diesel', 'petrol', 'lpg', 'electric')),
  tank_capacity_liters double precision,
  ev_range_km integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles (user_id) on delete cascade,
  label text not null,
  category text not null,
  place jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists saved_places_user_idx on saved_places (user_id, created_at desc);

create table if not exists saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles (user_id) on delete cascade,
  name text not null,
  origin_label text not null,
  origin_coords jsonb not null,
  destination_label text not null,
  destination_coords jsonb not null,
  waypoints jsonb not null default '[]'::jsonb,
  route_geojson jsonb,
  distance_km double precision,
  duration_min integer,
  vehicle_type text not null default 'car',
  created_at timestamptz not null default now()
);

create index if not exists saved_routes_user_idx on saved_routes (user_id, created_at desc);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'community_pin_category') then
    create type community_pin_category as enum (
      'traffic_jam',
      'accident',
      'border_queue',
      'rest_stop',
      'shortcut',
      'hotel',
      'place_to_visit',
      'police',
      'road_works',
      'other'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pin_vote_kind') then
    create type pin_vote_kind as enum ('still_there', 'gone');
  end if;
end $$;

create table if not exists community_pins (
  id uuid primary key default gen_random_uuid(),
  user_id text references profiles (user_id) on delete set null,
  category community_pin_category not null,
  title text not null,
  body text,
  lat double precision not null,
  lng double precision not null,
  photo_url text,
  upvotes integer not null default 0,
  gone_count integer not null default 0,
  expires_at timestamptz,
  hidden_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists community_pins_bbox_idx
  on community_pins (lng, lat);
create index if not exists community_pins_category_idx
  on community_pins (category, created_at desc);

create table if not exists community_pin_votes (
  pin_id uuid not null references community_pins (id) on delete cascade,
  user_id text not null references profiles (user_id) on delete cascade,
  kind pin_vote_kind not null,
  created_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);

create table if not exists pin_comments (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references community_pins (id) on delete cascade,
  user_id text references profiles (user_id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists pin_comments_pin_idx
  on pin_comments (pin_id, created_at);

create table if not exists community_pin_reports (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references community_pins (id) on delete cascade,
  reporter_id text not null references profiles (user_id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 300),
  created_at timestamptz not null default now(),
  unique (pin_id, reporter_id)
);
