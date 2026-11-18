-- "My checklists": the checklist of a planned trip, saved to the profile when
-- its PDF is made, with what has been ticked off. Apply after
-- drizzle/0007_border_reports.sql. Safe to run twice.

create table if not exists user_checklists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles (user_id) on delete cascade,
  -- One saved checklist per plan: the plan's own generated_at stamp.
  plan_key text not null,
  title text not null,
  destination text not null,
  depart_at timestamptz,
  groups jsonb not null,
  checks jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_key)
);

create index if not exists user_checklists_user_idx
  on user_checklists (user_id, updated_at desc);
