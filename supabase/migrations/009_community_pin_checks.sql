-- Migration 009 — Enforce community pin validation at the database
-- (mirrors API Zod so PostgREST cannot bypass length/coords/expiry).

alter table public.community_pins
  drop constraint if exists community_pins_title_len;
alter table public.community_pins
  add constraint community_pins_title_len
  check (char_length(title) between 3 and 160);

alter table public.community_pins
  drop constraint if exists community_pins_description_len;
alter table public.community_pins
  add constraint community_pins_description_len
  check (description is null or char_length(description) <= 1000);

alter table public.community_pins
  drop constraint if exists community_pins_coords_lng;
alter table public.community_pins
  add constraint community_pins_coords_lng
  check (
    (coords->>'lng') is not null
    and (coords->>'lng')::numeric between -25 and 45
  );

alter table public.community_pins
  drop constraint if exists community_pins_coords_lat;
alter table public.community_pins
  add constraint community_pins_coords_lat
  check (
    (coords->>'lat') is not null
    and (coords->>'lat')::numeric between 34 and 72
  );

alter table public.community_pins
  drop constraint if exists community_pins_expires_window;
alter table public.community_pins
  add constraint community_pins_expires_window
  check (
    expires_at is null
    or (
      expires_at > created_at
      and expires_at <= created_at + interval '168 hours'
    )
  );
