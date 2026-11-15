-- Stage 3 planner: national fuel averages, community prices, place flags, favorites.
-- Apply once after drizzle/0002_trip_planner_cache.sql. Do not run this against a database you do not own.

alter table profiles
  add column if not exists trip_preferences jsonb;

create table if not exists fuel_national_averages (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  fuel text not null,
  price_eur_per_l double precision not null,
  week text not null,
  source text not null,
  fetched_at timestamptz not null,
  unique (country_code, fuel, week, source)
);

create index if not exists fuel_national_averages_lookup_idx
  on fuel_national_averages (country_code, fuel, week desc);

create table if not exists fuel_price_reports (
  id uuid primary key default gen_random_uuid(),
  station_id text not null,
  fuel_type text not null,
  price double precision not null,
  currency text not null default 'EUR',
  photo_url text,
  reported_at timestamptz not null default now(),
  expires_at timestamptz not null,
  reporter_id text not null references profiles(user_id) on delete cascade
);

create index if not exists fuel_price_reports_station_idx
  on fuel_price_reports (station_id, fuel_type, expires_at);

create table if not exists place_flags (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  place_kind text not null,
  flag text not null,
  note text,
  user_id text not null references profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (place_id, user_id, flag),
  constraint place_flags_kind_chk
    check (place_kind in ('fuel', 'rest', 'hotel', 'restaurant')),
  constraint place_flags_flag_chk
    check (flag in (
      'cheap', 'expensive', 'dirty', 'clean', 'crowded',
      'paid_toilets', 'free_toilets', 'bad_coffee', 'good_coffee',
      'slow_service', 'fast_service', 'pet_friendly', 'kid_friendly',
      'safe_parking', 'unsafe'
    ))
);

create index if not exists place_flags_place_idx on place_flags (place_id);

create table if not exists favorite_routes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  name text not null,
  origin jsonb not null,
  destination jsonb not null,
  preferences jsonb not null,
  plan jsonb,
  created_at timestamptz not null default now()
);

create index if not exists favorite_routes_user_idx
  on favorite_routes (user_id, created_at desc);

create table if not exists favorite_places (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(user_id) on delete cascade,
  place_id text,
  kind text not null,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  note text,
  created_at timestamptz not null default now(),
  constraint favorite_places_kind_chk
    check (kind in ('fuel', 'hotel', 'restaurant', 'rest_area', 'custom'))
);

create unique index if not exists favorite_places_user_osm_idx
  on favorite_places (user_id, place_id)
  where place_id is not null;

create index if not exists favorite_places_user_idx
  on favorite_places (user_id, created_at desc);
