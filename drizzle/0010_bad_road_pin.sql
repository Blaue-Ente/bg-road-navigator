-- A new kind of community signal: a stretch of bad road (potholes, broken surface).
-- Safe to run more than once.
alter type community_pin_category add value if not exists 'bad_road';
