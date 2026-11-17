-- Garage: several cars per account, each with its own average consumption.
-- Apply after drizzle/0004_nakordoni_rate.sql. Safe to run twice.

create table if not exists user_vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles (user_id) on delete cascade,
  name text not null,
  vehicle_type text not null default 'car',
  fuel_type text not null default 'diesel',
  tank_capacity_liters double precision,
  ev_range_km integer,
  -- Extra-urban / motorway average: L/100 km, or kWh/100 km for electric cars.
  consumption_per_100 double precision,
  -- 'manual', 'fueleconomy.gov' or 'estimate'.
  consumption_source text not null default 'manual',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_vehicles_user_idx on user_vehicles (user_id);
create unique index if not exists user_vehicles_one_active_idx
  on user_vehicles (user_id) where is_active;
