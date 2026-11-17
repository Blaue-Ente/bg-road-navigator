-- Drivers' own border waits, shared with the next travellers.
-- Apply after drizzle/0006_push.sql. Safe to run twice.
-- Only the crossing, the minutes and the times are stored: never the route.

create table if not exists border_wait_reports (
  id uuid primary key default gen_random_uuid(),
  crossing_id text not null,
  user_id text not null references profiles (user_id) on delete cascade,
  minutes integer not null check (minutes between 1 and 720),
  from_country text,
  to_country text,
  source text not null default 'manual',
  reliable boolean not null default true,
  started_at timestamptz,
  reported_at timestamptz not null default now()
);

create index if not exists border_wait_reports_crossing_idx
  on border_wait_reports (crossing_id, reported_at desc);
create index if not exists border_wait_reports_user_idx
  on border_wait_reports (user_id, crossing_id, reported_at desc);
