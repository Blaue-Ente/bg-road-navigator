-- The last plans a driver generated, kept as inputs and a short summary so they
-- can be reopened and compared. Apply after drizzle/0010_bad_road_pin.sql.
-- Safe to run twice.

create table if not exists route_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles (user_id) on delete cascade,
  plan_key text not null,
  name text not null,
  inputs jsonb not null,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, plan_key)
);

create index if not exists route_history_user_idx on route_history (user_id, created_at desc);
