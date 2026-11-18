-- A bad-road signal can cover a stretch: where it ends. Null for a point.
-- Apply BEFORE deploying the code that reads these columns. Safe to run twice.

alter table community_pins add column if not exists end_lat double precision;
alter table community_pins add column if not exists end_lng double precision;
