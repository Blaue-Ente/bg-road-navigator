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