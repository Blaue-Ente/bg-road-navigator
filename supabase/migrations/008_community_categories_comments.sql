-- Migration 008 — Expand community pin categories for Waze-style reports
-- (camera, overnight, food) and index comments for Phase 2.

alter table public.community_pins drop constraint if exists community_pins_category_check;

alter table public.community_pins
  add constraint community_pins_category_check
  check (
    category in (
      'police',
      'camera',
      'accident',
      'hazard',
      'road_works',
      'traffic_jam',
      'fuel_issue',
      'border_info',
      'rest_area',
      'overnight',
      'food',
      'point_of_interest',
      'other'
    )
  );

create index if not exists pin_comments_pin_created_idx
  on public.pin_comments (pin_id, created_at desc);
