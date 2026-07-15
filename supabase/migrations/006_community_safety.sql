-- Community voting and reporting with one action per user/pin.

create table if not exists public.community_pin_votes (
  pin_id uuid not null references public.community_pins (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pin_id, user_id)
);

create table if not exists public.community_pin_reports (
  id uuid primary key default gen_random_uuid(),
  pin_id uuid not null references public.community_pins (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 300),
  created_at timestamptz not null default now(),
  unique (pin_id, reporter_id)
);

create or replace function public.sync_community_pin_upvotes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_pins
      set upvotes = upvotes + 1
      where id = new.pin_id;
    return new;
  end if;

  if tg_op = 'DELETE' then
    update public.community_pins
      set upvotes = greatest(0, upvotes - 1)
      where id = old.pin_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists community_pin_votes_counter on public.community_pin_votes;
create trigger community_pin_votes_counter
after insert or delete on public.community_pin_votes
for each row execute procedure public.sync_community_pin_upvotes();

alter table public.community_pin_votes enable row level security;
alter table public.community_pin_reports enable row level security;

create policy "community_votes_read_all"
  on public.community_pin_votes
  for select using (true);

create policy "community_votes_insert_own"
  on public.community_pin_votes
  for insert with check (user_id = auth.uid());

create policy "community_votes_delete_own"
  on public.community_pin_votes
  for delete using (user_id = auth.uid());

create policy "community_reports_insert_own"
  on public.community_pin_reports
  for insert with check (reporter_id = auth.uid());

create policy "community_reports_read_own"
  on public.community_pin_reports
  for select using (reporter_id = auth.uid());
