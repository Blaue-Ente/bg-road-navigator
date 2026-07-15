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
