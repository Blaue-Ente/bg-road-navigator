# Supabase schema

Apply once per project (SQL Editor or `psql`).

**One-shot:** paste [`apply_all.sql`](./apply_all.sql).

**Or in order** (there is no `003`):

1. `migrations/001_initial_schema.sql`
2. `migrations/002_community_pins.sql`
3. `migrations/004_rls_policies.sql`
4. `migrations/005_trip_planning.sql`
5. `migrations/006_community_safety.sql`
6. `migrations/007_profile_trigger_and_places.sql` ← profile-on-signup trigger
7. `migrations/008_community_categories_comments.sql`

`seed.sql` is optional and unused by the app (borders come from TypeScript constants).

After SQL + env keys, verify `GET /api/config/status` and create a real user (not demo).
