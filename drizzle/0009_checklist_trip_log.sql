-- The money and kilometres of a trip, kept with its checklist: the odometer at
-- the start and at the end, what was really spent, and the estimate made when
-- the plan was saved. Apply after drizzle/0008_user_checklists.sql. Safe to run twice.

alter table user_checklists
  add column if not exists trip_log jsonb;
