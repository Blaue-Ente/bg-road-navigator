<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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

### Phase 1 APIs (Better Auth + Neon Postgres required for writes)

- `GET/PATCH /api/profile`
- `GET/POST /api/saved-routes`, `DELETE /api/saved-routes/[id]`
- `GET/POST /api/saved-places`, `DELETE /api/saved-places/[id]`
- Maps handoff helpers: `lib/utils/maps-handoff.ts`

### Phase 2 community

- Map `+` → tap map → compose pin; list page uses geolocation.
- `GET /api/community/pins?west&south&east&north` (bbox filter)
- `GET/POST /api/community/pins/[id]/comments`
- Categories: traffic jam, accident, border queue, rest stop, shortcut, hotel, place, police, road works, other.

### Phase 3 — borders / vignettes / fuel / AI

- Border alternatives: `lib/constants/border-alternatives.ts` + `BorderAlternatives` on `/borders`
- OSRM route alternatives: `fetchOsrmRoute` with `alternatives=true`; picker on `/route`; drawn on home map via `alternativeRoutes`
- Official vignettes only: `lib/constants/vignettes.ts`, `/vignettes`, also on tips/borders/route
- Route-scoped fuel/EV: `GET /api/fuel?route=lng,lat;...` and `/fuel?route=1` with active route
- Trip planner: try NVIDIA (`NVIDIA_API_KEY`) then always fall back to heuristic; `planner_source` on response

### Keys-only readiness

- Code is ready for operators to paste env vars only (+ one-shot Neon SQL).
- `GET /api/config/status` — booleans/labels, never secret values
- `GET /api/health` — liveness, `database_configured`, `database_reachable`, `auth_tables_ready`
- UI: `/setup`, profile “Услуги и ключове”, sidebar → Настройка
- Apply DB once: `drizzle/0001_better_auth_and_community.sql` (see `docs/SETUP.md`)
- Template: `.env.example`

### Dev commands

See `README.md` / `package.json`: `npm run dev`, `npm run lint`, `npm test`, `npm run build`.

### Gotchas

- Do not copy `.env.example` blindly into `.env.local` for production builds of map style — empty `NEXT_PUBLIC_*` values are treated as unset by helpers, but prefer omitting blank vars.
- `AuthGuard` is a no-op shell; gate writes with `RequireAuth` / session checks.
- One account system: Better Auth on Neon (`DATABASE_URL`). Without it, writes return 503.
- On Vercel preview, leave `BETTER_AUTH_URL` unset so auth uses `https://$VERCEL_URL`.
- Google and Apple buttons appear only when both keys for that provider are set.
