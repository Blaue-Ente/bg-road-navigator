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
