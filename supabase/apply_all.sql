-- BG Road Navigator — one-shot Supabase apply
-- Apply in Supabase SQL Editor (or psql) AFTER creating the project.
-- Order matters. There is no 003 migration (numbering gap is intentional).
-- Generated for operator convenience; source of truth remains supabase/migrations/*


-- =====================================================================
-- BEGIN 001_initial_schema.sql
-- =====================================================================

-- Migration 001 — Core tables
-- profiles: links to Supabase auth.users, stores vehicle preferences
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  avatar_url text,
  vehicle_type text not null check (vehicle_type in ('car', 'ev', 'truck', 'motorcycle')),
  fuel_type text not null check (fuel_type in ('diesel', 'petrol', 'lpg', 'electric')),
  tank_capacity_liters numeric(5, 1),
  ev_range_km integer,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

-- saved_routes: user-created routes persisted for later use
create table if not exists public.saved_routes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  origin_label text not null,
  origin_coords jsonb not null,
  destination_label text not null,
  destination_coords jsonb not null,
  waypoints jsonb not null default '[]'::jsonb,
  route_geojson jsonb,
  distance_km numeric(8, 1),
  duration_min integer,
  created_at timestamptz not null default now()
);

create index if not exists saved_routes_user_id_idx on public.saved_routes (user_id);

-- END 001_initial_schema.sql

-- =====================================================================
-- BEGIN 002_community_pins.sql
-- =====================================================================

-- Migration 002 — Community tables
create table if not exists public.community_pins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  category text not null check (
    category in ('police', 'accident', 'hazard', 'road_works', 
                 'traffic_jam', 'fuel_issue', 'border_info', 
                 'rest_area', 'point_of_interest', 'other')
  ),
  title text not null,
  description text,
  coords jsonb not null,
  is_verified boolean not null default false,
  upvotes integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- JSON coordinates can be filtered by bbox in application code. A GIN index
-- supports JSON containment without requiring a PostGIS geometry migration.
create index if not exists community_pins_coords_idx on public.community_pins
using gin (coords);

-- pin_comments: comments on community pins
create table if not exists public.pin_comments (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references public.community_pins (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);
-- END 002_community_pins.sql

-- =====================================================================
-- BEGIN 004_rls_policies.sql
-- =====================================================================

-- Migration 004 — Row Level Security + saved_routes vehicle_type
-- Note: Postgres does not support "CREATE POLICY IF NOT EXISTS".
-- Policies are dropped and recreated so this file is safe on fresh installs.

alter table public.saved_routes
  add column if not exists vehicle_type text not null default 'car'
  check (vehicle_type in ('car', 'ev', 'truck', 'motorcycle'));

alter table public.profiles enable row level security;
alter table public.saved_routes enable row level security;
alter table public.community_pins enable row level security;
alter table public.pin_comments enable row level security;

-- profiles -----------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts are created by the auth.users trigger (security definer).
-- Allow an authenticated user to insert only their own row as a fallback.
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- saved_routes -------------------------------------------------------------
drop policy if exists "saved_routes_select_own" on public.saved_routes;
drop policy if exists "saved_routes_insert_own" on public.saved_routes;
drop policy if exists "saved_routes_update_own" on public.saved_routes;
drop policy if exists "saved_routes_delete_own" on public.saved_routes;

create policy "saved_routes_select_own"
  on public.saved_routes
  for select
  using (user_id = auth.uid());

create policy "saved_routes_insert_own"
  on public.saved_routes
  for insert
  with check (user_id = auth.uid());

create policy "saved_routes_update_own"
  on public.saved_routes
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "saved_routes_delete_own"
  on public.saved_routes
  for delete
  using (user_id = auth.uid());

-- community_pins -----------------------------------------------------------
drop policy if exists "community_pins_select_all" on public.community_pins;
drop policy if exists "community_pins_insert_own" on public.community_pins;
drop policy if exists "community_pins_delete_owner" on public.community_pins;

create policy "community_pins_select_all"
  on public.community_pins
  for select
  using (true);

create policy "community_pins_insert_own"
  on public.community_pins
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "community_pins_delete_owner"
  on public.community_pins
  for delete
  using (user_id = auth.uid());

-- pin_comments -------------------------------------------------------------
drop policy if exists "pin_comments_select_all" on public.pin_comments;
drop policy if exists "pin_comments_insert_owner" on public.pin_comments;
drop policy if exists "pin_comments_delete_owner" on public.pin_comments;

create policy "pin_comments_select_all"
  on public.pin_comments
  for select
  using (true);

create policy "pin_comments_insert_owner"
  on public.pin_comments
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "pin_comments_delete_owner"
  on public.pin_comments
  for delete
  using (user_id = auth.uid());

-- END 004_rls_policies.sql

-- =====================================================================
-- BEGIN 005_trip_planning.sql
-- =====================================================================

-- Persisted travel plans, stops and notification subscriptions.
-- Apply through the Supabase migration workflow before enabling these features.

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'draft'
    check (status in ('draft', 'planned', 'active', 'completed', 'archived')),
  origin jsonb not null,
  destination jsonb not null,
  route_geojson jsonb,
  routing_source text check (routing_source in ('osrm', 'estimate')),
  distance_km numeric(8, 1),
  duration_min integer check (duration_min is null or duration_min >= 0),
  departure_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  position integer not null check (position >= 0),
  stop_type text not null
    check (stop_type in ('waypoint', 'fuel', 'ev_charge', 'rest', 'overnight', 'border')),
  place jsonb not null,
  planned_arrival_at timestamptz,
  planned_duration_min integer check (
    planned_duration_min is null or planned_duration_min >= 0
  ),
  notes text check (char_length(notes) <= 1000),
  provider text,
  provider_reference text,
  created_at timestamptz not null default now(),
  unique (trip_id, position)
);

create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  place jsonb not null,
  category text not null default 'other'
    check (category in ('home', 'work', 'favorite', 'overnight', 'other')),
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  keys jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists trips_user_updated_idx
  on public.trips (user_id, updated_at desc);
create index if not exists trip_stops_trip_position_idx
  on public.trip_stops (trip_id, position);
create index if not exists saved_places_user_idx
  on public.saved_places (user_id, created_at desc);
create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.trips enable row level security;
alter table public.trip_stops enable row level security;
alter table public.saved_places enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "trips_owner_access"
  on public.trips
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "trip_stops_owner_access"
  on public.trip_stops
  for all
  using (
    exists (
      select 1
      from public.trips
      where trips.id = trip_stops.trip_id
        and trips.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.trips
      where trips.id = trip_stops.trip_id
        and trips.user_id = auth.uid()
    )
  );

create policy "saved_places_owner_access"
  on public.saved_places
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "push_subscriptions_owner_access"
  on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- END 005_trip_planning.sql

-- =====================================================================
-- BEGIN 006_community_safety.sql
-- =====================================================================

-- Community voting and reporting with one action per user/pin.

create table if not exists public.community_pin_votes (
  pin_id uuid not null references public.community_pins (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);

create table if not exists public.community_pin_reports (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references public.community_pins (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 300),
  created_at timestamptz not null default now(),
  unique (pin_id, reporter_id)
);

create or replace function public.sync_community_pin_upvotes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_pins
      set upvotes = upvotes + 1
      where id = new.pin_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.community_pins
      set upvotes = greatest(0, upvotes - 1)
      where id = old.pin_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists community_pin_votes_counter on public.community_pin_votes;
create trigger community_pin_votes_counter
after insert or delete on public.community_pin_votes
for each row execute procedure public.sync_community_pin_upvotes();

alter table public.community_pin_votes enable row level security;
alter table public.community_pin_reports enable row level security;

create policy "community_votes_read_all"
  on public.community_pin_votes
  for select using (true);

create policy "community_votes_insert_own"
  on public.community_pin_votes
  for insert with check (user_id = auth.uid());

create policy "community_votes_delete_own"
  on public.community_pin_votes
  for delete using (user_id = auth.uid());

create policy "community_reports_insert_own"
  on public.community_pin_reports
  for insert with check (reporter_id = auth.uid());

create policy "community_reports_read_own"
  on public.community_pin_reports
  for select using (reporter_id = auth.uid());

-- END 006_community_safety.sql

-- =====================================================================
-- BEGIN 007_profile_trigger_and_places.sql
-- =====================================================================

-- Migration 007 — Auto-create profile on signup + expand saved_places categories
-- for favorites (places, fuel, borders, overnight, food) used in later phases.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_username text;
begin
  chosen_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  if chosen_username is null then
    chosen_username := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  -- Keep usernames unique even if email local-part collides.
  if exists (select 1 from public.profiles where username = chosen_username) then
    chosen_username := chosen_username || '-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, vehicle_type, fuel_type)
  values (new.id, chosen_username, 'car', 'diesel')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Expand saved_places categories for Phase 1 favorites without a table rewrite.
alter table public.saved_places drop constraint if exists saved_places_category_check;
alter table public.saved_places
  add constraint saved_places_category_check
  check (
    category in (
      'home',
      'work',
      'favorite',
      'overnight',
      'fuel',
      'ev_charge',
      'border',
      'food',
      'rest',
      'other'
    )
  );

-- END 007_profile_trigger_and_places.sql

-- =====================================================================
-- BEGIN 008_community_categories_comments.sql
-- =====================================================================

-- Migration 008 — Expand community pin categories for Waze-style reports
-- (camera, overnight, food) and index comments for Phase 2.

alter table public.community_pins drop constraint if exists community_pins_category_check;

alter table public.community_pins
  add constraint community_pins_category_check
  check (
    category in (
      'police',
      'camera',
      'accident',
      'hazard',
      'road_works',
      'traffic_jam',
      'fuel_issue',
      'border_info',
      'rest_area',
      'overnight',
      'food',
      'point_of_interest',
      'other'
    )
  );

create index if not exists pin_comments_pin_created_idx
  on public.pin_comments (pin_id, created_at desc);

-- END 008_community_categories_comments.sql
