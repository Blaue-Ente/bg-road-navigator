-- Web push for trip notices when the page is closed.
-- Apply after drizzle/0005_user_vehicles.sql. Safe to run twice.

create table if not exists push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  locale text not null default 'bg',
  created_at timestamptz not null default now()
);

create table if not exists trip_push_queue (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null references push_subscriptions (endpoint) on delete cascade,
  trip_id text not null,
  send_at timestamptz not null,
  title text not null,
  body text not null,
  url text not null default '/',
  tag text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists trip_push_queue_due_idx
  on trip_push_queue (send_at) where sent_at is null;
create index if not exists trip_push_queue_trip_idx
  on trip_push_queue (endpoint, trip_id);
