-- Shared caches for the deterministic trip planner.
-- Nakordoni responses are filled by the cron, never by a user request.
-- Apply once after drizzle/0001_better_auth_and_community.sql. See docs/SETUP.md.

create table if not exists nakordoni_cache (
  cache_key text primary key,
  kind text not null,
  payload jsonb not null,
  fetched_at timestamptz not null,
  expires_at timestamptz not null,
  observed_at timestamptz
);

create index if not exists nakordoni_cache_expires_idx
  on nakordoni_cache (expires_at);

create table if not exists nakordoni_budget (
  day text primary key,
  cheap_calls integer not null default 0,
  heavy_calls integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists osm_query_cache (
  cache_key text primary key,
  kind text not null,
  payload jsonb not null,
  fetched_at timestamptz not null,
  expires_at timestamptz not null
);
