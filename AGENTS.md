<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product decisions (approved)

- Browse without login. Auth unlocks favorites, saved routes, and community writes.
- In-app planning + handoff to Google Maps / Apple Maps. OSRM maneuver list is prep only — no live in-app turn-by-turn in this release.
- Light and dark themes (map style switches with theme).
- AI trip planner later via `NVIDIA_API_KEY` (free NVIDIA models); keep a heuristic fallback.
- Cost-constrained: graceful degradation without TomTom / OpenCharge / Nakordoni keys.
- Killer features for first public release: live borders, vignettes (official deep links only), community, places/favorites.
- Operators paste env vars themselves; never commit secrets. Checklist: `/setup`, `.env.example`, `GET /api/config/status`.

### Phase 1 APIs (auth + Supabase required for writes)

- `GET/PATCH /api/profile`
- `GET/POST /api/saved-routes`, `DELETE /api/saved-routes/[id]`
- `GET/POST /api/saved-places`, `DELETE /api/saved-places/[id]`
- Maps handoff helpers: `lib/utils/maps-handoff.ts`

### Phase 2 community

- Map `+` → tap map → compose pin; list page uses geolocation.
- `GET /api/community/pins?west&south&east&north` (bbox filter)
- `GET/POST /api/community/pins/[id]/comments`
- Categories include camera / food / overnight (`008_community_categories_comments.sql`)
- Apply Supabase migrations through `009` before enabling community writes in production.

### Phase 3 — borders / vignettes / fuel / AI

- Border alternatives: `lib/constants/border-alternatives.ts` + `BorderAlternatives` on `/borders`
- OSRM route alternatives: `fetchOsrmRoute` with `alternatives=true`; picker on `/route`; drawn on home map via `alternativeRoutes`
- Official vignettes only: `lib/constants/vignettes.ts`, `/vignettes`, also on tips/borders/route
- Route-scoped fuel/EV: `GET /api/fuel?route=lng,lat;...` and `/fuel?route=1` with active route
- Trip planner: try NVIDIA (`NVIDIA_API_KEY`) then always fall back to heuristic; `planner_source` on response

### Keys-only readiness

- Code is ready for operators to paste env vars only (+ one-shot Supabase SQL).
- `GET /api/config/status` — booleans/labels, never secret values
- `GET /api/health` — liveness
- UI: `/setup`, profile “Услуги и ключове”, sidebar → Настройка
- Apply DB once: `supabase/apply_all.sql` (see `supabase/README.md`)
- Template: `.env.example`

### Dev commands

See `README.md` / `package.json`: `npm run dev`, `npm run lint`, `npm test`, `npm run build`.

### Gotchas

- Do not copy `.env.example` blindly into `.env.local` for production builds of map style — empty `NEXT_PUBLIC_*` values are treated as unset by helpers, but prefer omitting blank vars.
- `AuthGuard` is a no-op shell; gate writes with `RequireAuth` / session checks.
- Supabase RLS lives in `supabase/migrations/`; `004` was rewritten for valid Postgres policies; apply `007` for profile-on-signup trigger (included in `apply_all.sql`).
- Without Supabase keys, login creates a **demo** session — writes return 503 until real Supabase + migrations.
