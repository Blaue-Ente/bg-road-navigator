-- Global Nakordoni HTTP pacing across serverless instances (2 req/s plan limit).
-- Apply after drizzle/0003_planner_places.sql.

create table if not exists nakordoni_rate (
  id smallint primary key default 1 check (id = 1),
  next_slot_ms bigint not null default 0
);

insert into nakordoni_rate (id, next_slot_ms)
values (1, 0)
on conflict (id) do nothing;