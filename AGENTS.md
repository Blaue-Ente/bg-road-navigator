<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product decisions (approved)

- Browse without login. Auth unlocks favorites, saved routes, and community writes.
- First visit stays Bulgarian (SSR); non-`bg` browsers may see a one-tap language offer (no auto-switch).
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
- Road routing: `fetchDrivingRoute` tries Valhalla (`OCI_GEO_BASE_URL` + `OCI_GEO_API_KEY`, header `X-API-Key`, server-side only) and falls back to `fetchOsrmRoute` (`OSRM_API_URL` or the public demo). The trip plan returns one divergent alternative (`route_options`); picking it POSTs `/api/plan` again and draws that line on the home map via `alternativeRoutes`
- Geocoding: Photon when those OCI vars are set (map-view bias + `lang`), else Nominatim. Queries with a house number rank the exact street + housenumber first; city queries without a number keep the city/station re-rank. Photon waits 12s on a cold process and 7s after a recent success. `GET /api/cron/warm-geo` (daily Hobby cron in `vercel.json`; `CRON_SECRET` bearer when set) pings Valhalla `/status` and a one-hit Photon query and never returns the OCI key. `GEOCODING_API_URL` still overrides the Nominatim host. Unset either OCI var and both paths match the public behaviour
- Official vignettes only: `lib/constants/vignettes.ts`, `/vignettes`, also on tips/borders/route
- Route-scoped fuel/EV: `GET /api/fuel?route=lng,lat;...` and `/fuel?route=1` with active route
- Trip planner: `POST /api/trips/plan` tries NVIDIA (`NVIDIA_API_KEY`) then the heuristic. `POST /api/plan` is the deterministic planner (borders, fuel, rest, preferences, checklist, weather) in `lib/planner/*`. Bulgarian border candidates are forced only when `tripMayCrossBulgaria` is true for the trip ends (e.g. DE→RO uses the direct line; DE→TR still compares BG crossings). It reads the Nakordoni cache only. Corridor places come from `OCI_POI_BASE_URL` (default `OCI_GEO_BASE_URL/poi`, header `X-API-Key`). Public Overpass runs only when `POI_OVERPASS_FALLBACK` is `1`, `true`, or `yes`. Daily `GET /api/cron/fuel-bulletin` stores the European Commission Weekly Oil Bulletin. Apply `drizzle/0003_planner_places.sql` before profile preferences, flags, price reports, and favorites. `POST /api/plan` accepts an optional `via` array of up to three `{label,lng,lat}` points; omit it and routing stays origin–destination. Each plan stop may include `stars` (1–5 from OSM, or null). A border wait may include `unlicensed_market` and `traffic_delay_min`; the plan sheet then shows typical wait without a Nakordoni credit. A favorite route's `plan` JSON may be the planner result or `{ kind: "bg-road-favorite-v1", inputs: { via, depart_at, fuel_level }, result }`.

### Garage and saved routes

- `GET/POST /api/vehicles`, `PATCH/DELETE /api/vehicles/[id]` (needs `drizzle/0005_user_vehicles.sql`; without it the garage UI says so and planning falls back to the profile car). `GET /api/vehicles/lookup?q=` finds a known extra-urban consumption from the US EPA list (fueleconomy.gov) and, only when `NVIDIA_API_KEY` is set, a labelled estimate. `POST /api/plan` takes an optional `vehicle_id`; omitted, the driver's default garage car is used.
- `PATCH /api/favorites/routes/[id]` renames or updates a favorite route. New UI strings live in `scripts/i18n-features.json`; run `python3 scripts/i18n-features.py` to regenerate `lib/i18n/locales/bg-features.ts` and the en/tr/ro overrides.
- Rest breaks count from the previous stop of any kind (`mergeDrivingBreaks`), so a longer `break_every_min` is honoured.

### Keys-only readiness

- Code is ready for operators to paste env vars only (+ one-shot Neon SQL).
- `GET /api/config/status` — booleans/labels, never secret values
- `GET /api/health` — liveness, `database_configured`, `database_reachable`, `auth_tables_ready`
- UI: `/setup`, profile “Услуги и ключове”, sidebar → Настройка
- Apply DB once: `drizzle/0001_better_auth_and_community.sql`, then `drizzle/0002_trip_planner_cache.sql`, then `drizzle/0003_planner_places.sql` (see `docs/SETUP.md`). Hobby crons: Nakordoni `20 5 * * *` (Pro may use `*/15 * * * *`; production 401 without `CRON_SECRET`), warm-geo `0 8 * * *` (Pro may use `*/10 * * * *`; stays open when the secret is unset), and fuel bulletin `30 6 * * *` (production 401 without `CRON_SECRET`). `TANKERKOENIG_API_KEY` is optional. `OCI_POI_BASE_URL` is optional when `OCI_GEO_BASE_URL` is set.
- Template: `.env.example`

### Dev commands

See `README.md` / `package.json`: `npm run dev`, `npm run lint`, `npm test`, `npm run build`.

### Gotchas

- Do not copy `.env.example` blindly into `.env.local` for production builds of map style — empty `NEXT_PUBLIC_*` values are treated as unset by helpers, but prefer omitting blank vars.
- `AuthGuard` is a no-op shell; gate writes with `RequireAuth` / session checks.
- One account system: Better Auth on Neon (`DATABASE_URL`). Without it, writes return 503.
- On Vercel preview, leave `BETTER_AUTH_URL` unset so auth uses `https://$VERCEL_URL`.
- Google and Apple buttons appear only when both keys for that provider are set.
