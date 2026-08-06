<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product decisions (approved)

- Browse without login. Auth unlocks favorites, saved routes, and community writes.
- In-app planning + handoff to Google Maps / Apple Maps (no full turn-by-turn in v1).
- AI trip planner later via `NVIDIA_API_KEY` (free NVIDIA models); keep a heuristic fallback.
- Cost-constrained: graceful degradation without TomTom / OpenCharge / Nakordoni keys.
- Killer features for first public release: live borders, vignettes (official deep links only), community, places/favorites.

### Phase 1 APIs (auth + Supabase required for writes)

- `GET/PATCH /api/profile`
- `GET/POST /api/saved-routes`, `DELETE /api/saved-routes/[id]`
- `GET/POST /api/saved-places`, `DELETE /api/saved-places/[id]`
- Maps handoff helpers: `lib/utils/maps-handoff.ts`

### Dev commands

See `README.md` / `package.json`: `npm run dev`, `npm run lint`, `npm test`, `npm run build`.

### Gotchas

- Do not copy `.env.example` blindly into `.env.local` for production builds of map style — empty `NEXT_PUBLIC_*` values are treated as unset by helpers, but prefer omitting blank vars.
- `AuthGuard` is a no-op shell; gate writes with `RequireAuth` / session checks.
- Supabase RLS lives in `supabase/migrations/`; `004` was rewritten for valid Postgres policies; apply `007` for profile-on-signup trigger.
