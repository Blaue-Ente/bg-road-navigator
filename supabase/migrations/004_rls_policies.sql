-- Migration 004 — Row Level Security + saved_routes vehicle_type
-- Note: Postgres does not support "CREATE POLICY IF NOT EXISTS".
-- Policies are dropped and recreated so this file is safe on fresh installs.

alter table public.saved_routes
  add column if not exists vehicle_type text not null default 'car'
  check (vehicle_type in ('car', 'ev', 'truck', 'motorcycle'));

alter table public.profiles enable row level security;
alter table public.saved_routes enable row level security;
alter table public.community_pins enable row level security;
alter table public.pin_comments enable row level security;

-- profiles -----------------------------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts are created by the auth.users trigger (security definer).
-- Allow an authenticated user to insert only their own row as a fallback.
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- saved_routes -------------------------------------------------------------
drop policy if exists "saved_routes_select_own" on public.saved_routes;
drop policy if exists "saved_routes_insert_own" on public.saved_routes;
drop policy if exists "saved_routes_update_own" on public.saved_routes;
drop policy if exists "saved_routes_delete_own" on public.saved_routes;

create policy "saved_routes_select_own"
  on public.saved_routes
  for select
  using (user_id = auth.uid());

create policy "saved_routes_insert_own"
  on public.saved_routes
  for insert
  with check (user_id = auth.uid());

create policy "saved_routes_update_own"
  on public.saved_routes
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "saved_routes_delete_own"
  on public.saved_routes
  for delete
  using (user_id = auth.uid());

-- community_pins -----------------------------------------------------------
drop policy if exists "community_pins_select_all" on public.community_pins;
drop policy if exists "community_pins_insert_own" on public.community_pins;
drop policy if exists "community_pins_delete_owner" on public.community_pins;

create policy "community_pins_select_all"
  on public.community_pins
  for select
  using (true);

create policy "community_pins_insert_own"
  on public.community_pins
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "community_pins_delete_owner"
  on public.community_pins
  for delete
  using (user_id = auth.uid());

-- pin_comments -------------------------------------------------------------
drop policy if exists "pin_comments_select_all" on public.pin_comments;
drop policy if exists "pin_comments_insert_owner" on public.pin_comments;
drop policy if exists "pin_comments_delete_owner" on public.pin_comments;

create policy "pin_comments_select_all"
  on public.pin_comments
  for select
  using (true);

create policy "pin_comments_insert_owner"
  on public.pin_comments
  for insert
  with check (auth.uid() is not null and user_id = auth.uid());

create policy "pin_comments_delete_owner"
  on public.pin_comments
  for delete
  using (user_id = auth.uid());
