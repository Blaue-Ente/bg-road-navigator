-- Migration 007 — Auto-create profile on signup + expand saved_places categories
-- for favorites (places, fuel, borders, overnight, food) used in later phases.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_username text;
begin
  chosen_username := nullif(trim(coalesce(new.raw_user_meta_data->>'username', '')), '');
  if chosen_username is null then
    chosen_username := split_part(coalesce(new.email, 'user'), '@', 1);
  end if;

  -- Keep usernames unique even if email local-part collides.
  if exists (select 1 from public.profiles where username = chosen_username) then
    chosen_username := chosen_username || '-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  insert into public.profiles (id, username, vehicle_type, fuel_type)
  values (new.id, chosen_username, 'car', 'diesel')
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Expand saved_places categories for Phase 1 favorites without a table rewrite.
alter table public.saved_places drop constraint if exists saved_places_category_check;
alter table public.saved_places
  add constraint saved_places_category_check
  check (
    category in (
      'home',
      'work',
      'favorite',
      'overnight',
      'fuel',
      'ev_charge',
      'border',
      'food',
      'rest',
      'other'
    )
  );
