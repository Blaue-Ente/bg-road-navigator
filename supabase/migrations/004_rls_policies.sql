-- Migration 003 — Saved routes (continued)
alter table public.saved_routes
add column if not exists vehicle_type text not null check (vehicle_type in ('car', 'ev', 'truck', 'motorcycle'));

-- Migration 004 — Row Level Security policies
-- enable row level security
alter table public.profiles enable row level security;
alter table public.saved_routes enable row level security;
alter table public.community_pins enable row level security;
alter table public.pin_comments enable row level security;

-- profiles: users can read their own profile, update their own profile
create policy if not exists "profiles_select_own"
  on public.profiles
  for select using auth.uid() = id;

create policy if not exists "profiles_update_own"
  on public.profiles
  for update using auth.uid() = id;

-- saved_routes: users can create, read, update, delete their own saved routes
create policy if not exists "saved_routes_select_own"
  on public.saved_routes
  for select
  using (user_id = auth.uid() and rowsecurity.policy_is_admin() = false);

create policy if not exists "saved_routes_insert_own"
  on public.saved_routes
  for insert
  with check (user_id = auth.uid());

create policy if not exists "saved_routes_update_own"
  on public.saved_routes
  for update
  using (user_id = auth.uid());

create policy if not exists "saved_routes_delete_own"
  on public.saved_routes
  for delete
  using (user_id = auth.uid());

-- community_pins: anyone can read public pins, authenticated users can insert pins, owners can delete their own pins
create policy if not exists "community_pins_select_all"
  on public.community_pins
  for select
  using (true);

create policy if not exists "community_pins_insert_own"
  on public.community_pins
  for insert
  with check (auth.uid() is not null);

create policy if not exists "community_pins_delete_owner"
  on public.community_pins
  for delete
  using (user_id = auth.uid());

-- pin_comments: anyone can read pin comments, authenticated users can insert comments, owners can delete thier own comments
create policy if not exists "pin_comments_select_all"
  on public.pin_comments
  for select
  using (true);

create policy if not exists "pin_comments_insert_owner"
  on public.pin_comments
  for insert
  with check (auth.uid() is not null);

create policy if not exists "pin_comments_delete_owner"
  on public.pin_comments
  for delete
  using (user_id = auth.uid());