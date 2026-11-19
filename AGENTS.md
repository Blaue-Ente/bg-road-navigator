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

### Where to sleep (Tripadvisor Terra, RouteStack)

- `GET /api/stays?lat&lng&checkin&adults&children&locale&pet[&debug=1]` (rate limited, `no-store`). Tripadvisor comes from **Terra** (`terra.tripadvisor.com/api`, header `X-API-Key`, `?version=1`), not the retired Content API: `lib/api-clients/tripadvisor.ts` calls `/catalog/locations/nearby` (hotels, radius max 8 km, one billable unit per returned place). Its key may be named `TRIPADVISOR_API_KEY` or `TRIPADVISOR_API`. Terra forbids keeping content (no fetch cache, no DB copy, `Cache-Control: no-store`), requires links back to Tripadvisor (name, review count) and the credit line, and bans review text in page source, so only rating, count, link and the bubble icon are used. Cost guards: `TRIPADVISOR_RESULT_SIZE` (default 6) and `TRIPADVISOR_DAILY_LIMIT` (per server, default 200); `debug=1` shows `tripadvisor_error` (status and message, never the key).
- RouteStack (`lib/api-clients/routestack.ts`) lists bookable hotels with prices; its rows have no booking link yet.

### Shared cache (saves provider calls)

- `lib/cache/shared-cache.ts` (`cachedValue`): memory first, then Neon table `osm_query_cache` (already created by `drizzle/0002`, so no new SQL), identical simultaneous calls share one request, failures are never kept. `persist: true` only for data whose terms allow keeping it; `persist: false` keeps it in this server's memory for a short time.
- Kept in Neon: RouteStack hotel prices per city, night and party (`ROUTESTACK_CACHE_MINUTES`, default 60; confirm RouteStack allows it) and OpenChargeMap by about 5 km cell (`OPENCHARGE_CACHE_MINUTES`, default 360; open data). Distances are recomputed from the real point.
- Memory only: TomTom fuel stations (`TOMTOM_PLACES_CACHE_MINUTES`, 30), TomTom incident tiles (`TRAFFIC_CACHE_SECONDS`, 300) and HERE incident tiles (`HERE_CACHE_SECONDS`, 300), because those terms do not clearly allow storing.
- Never kept: Tripadvisor Terra content (its caching policy allows only the Location ID).
- Traffic: `GET /api/traffic?bbox=w,s,e,n` merges TomTom Incident Details **v5** (`lib/api-clients/tomtom.ts`; the old v4-style call never returned anything) with HERE Traffic v7 (`HERE_API_KEY`, `lib/api-clients/here-traffic.ts`). Both providers refuse areas over about one degree, so the view is split into grid-aligned 1-degree tiles (`lib/traffic/tiles.ts`, at most 6, nearest the centre) that drivers share. Serious incidents only; near-identical reports of the same type within 250 m are merged. The map sends its real visible area (`useMapStore.view.bounds`), only while the traffic layer is on and zoom is 8 or more. `?debug=1` adds `tomtom_configured`, `tomtom_error`, `here_configured` and `here_error` (status and message, never a key). `GET /api/config/status` lists `here`, `tripadvisor` and `routestack` as booleans.

### Border waits from drivers

- `lib/borders/crossing-watch.ts` (pure, tested): with positions only, it measures the wait from the first slow fix within 3 km of a crossing to the first fast fix after the country changed. A pass that turns round, a stretch with no fixes (marks it unreliable) and waits under 5 minutes produce nothing. It works only while the page is open and receiving positions; browsers give no location in the background, especially on iPhone.
- `useBorderCrossingWatch` runs during trip mode with location allowed (`BorderTimeWatcher` on the map); the country outlines (130 KB) load only within 15 km of a crossing. `BorderTimePrompt` asks the driver to confirm or correct the minutes; a signed-in driver sends it to `POST /api/borders/reports` (writes need an account; one report per driver and crossing per 30 minutes; only crossing, minutes and times are stored, never the route). Needs `drizzle/0007_border_reports.sql`.
- `/api/borders` adds `driver_reports` (middle value of the last 3 hours, with count and latest time) per crossing; `BorderCard` shows it. Missing table: it is simply left out.
- Closed app: the trip push plan carries `border` (id, name, expected arrival, expected wait). `buildPushSchedule` sends "Did you cross X?" about 25 minutes after the expected crossing; it opens `/?border=<id>&wait=<min>`, which asks for the real wait (`origin: "estimate"`).
- Tankerkönig prices are shared per 5 km cell for `TANKERKOENIG_CACHE_MINUTES` (default 10, open data, kept in Neon); Fuelo country averages already use a 24-hour Next data cache.

### Speed cameras

- `GET /api/speed-cameras?w&s&e&n[&debug=1]` serves fixed cameras (OpenStreetMap `highway=speed_camera`, ODbL) from `lib/data/speed-cameras.json` when it has points: instant, no outside call. The file is built by `scripts/speed-cameras/build.py` (needs `osmium` and Geofabrik) in the GitHub workflow `.github/workflows/speed-cameras.yml` (manual run or monthly), which opens a draft PR when the data changed. Countries: BG RS RO HU GR MK TR DE AT PL CZ SK SI HR NL BE DK IT ES PT. France and Switzerland are left out on purpose (showing camera positions is banned) and also filtered at runtime. While the file has no points, the route falls back to the public Overpass mirrors (slow from Vercel; failures are `no-store`). Map points only: no alerts, and none while driving in DE/AT.

### Trip advice, PDF and "My checklists"

- `POST /api/ai/trip-guide` (`lib/ai/trip-guide.ts`, input from `lib/ai/trip-guide-input.ts`): the AI writes the trip as free text under short headings (`sections`), plus `overnight` entries (`where` = a hotel the map names, otherwise the town; the server reverse-geocodes the town because an overnight stop can be anchored on a filling station) and a closing line. It only rephrases the facts it is sent; claims about cleanliness or safety go under "check before you book". No key means `available: false`.
- `PlanStop.hotel` is the hotel the map names near an overnight stop; a combined fuel + overnight stop never shows the station as the bed. `plan.food_spots` are fast-food chains near the road (`lib/planner/food-spots.ts`). Fuel stops get a good/fine/avoid verdict from price colour and driver flags (`lib/planner/fuel-verdict.ts`); planned charge stops get a busy-hours note (`lib/planner/ev-peak.ts`, a rule of thumb).
- PDF: `lib/pdf/trip-pdf.ts` (pdf-lib + Liberation Sans from `public/fonts`, SIL OFL) builds the written plan on page 1 (more pages only if it cannot fit) and the checklist as a table with a box per item on the next page. `lib/pdf/plan-pdf.ts` maps a plan to it; without the AI text page 1 is a plain summary. Generated in the browser (`components/plan/useTripPdf.ts`); there is no print button any more.
- Profile "My checklists" (`drizzle/0008_user_checklists.sql`, `GET/POST/PATCH /api/checklists`, `PATCH/DELETE /api/checklists/[id]`, `components/profile/MyChecklistsPanel.tsx`): the PDF save also keeps the checklist for a signed-in driver, named by the date and the destination; ticks in the plan sheet and in the profile are merged by plan key (`checklistPlanKey`, stable when a trip is replanned). Without the table the panel says it is not set up.
- Preferences: `adults` (hotel search: adults, children's ages, rooms) and `break_exact` (keep the chosen break interval instead of shortening it for a young child). The planner takes up to three `via` points (`MAX_VIA`).
- Fuel list: `/api/fuel` fills diesel/petrol prices from Tankerkönig (DE, needs `TANKERKOENIG_API_KEY`) and E-Control (AT) for stations within 200 m (`lib/fuel/station-prices.ts`); fuel types and opening hours come from OpenStreetMap tags (`lib/fuel/station-tags.ts`).
- Speed cameras: `lib/data/speed-cameras.json` holds 23,339 cameras (20 countries) built by the workflow; the live Overpass path is only used while the file is empty.

- Day load and the AI plan's reasoning: preference `car_comfort` (`roomy` | `standard` | `compact`, form select). A compact car caps the break interval at 105 min (unless `break_exact`) and cuts the driving day by 1.5 h (`lib/planner/preferences.ts`). An overnight arrival between 06:00 and 15:59 local rests 8 h and goes on (`wakeAt`); only an evening or night arrival waits for 08:00. On `scenic` pace the planner also asks Valhalla for a road with `use_highways` 0.3 (`withScenic` in `lib/planner/via-route.ts`, `chooseScenicRoute` in `lib/planner/scenic.ts`) and uses it only when it differs and is at most +25% and +2 h longer than the fast one, and only on trips up to 600 km (`SCENIC_MAX_TRIP_KM`; live tests on 1900-2200 km gave +3-8 h or no change, so `long_trip` skips the extra request; on Sofia to Veliko Tarnovo, 225 km, 0.3 gives +10 km and +22 min); `plan.route.scenic` says what was decided and why (`applied`, `same`, `too_long`, `unsupported` without Valhalla). No country is excluded, because many sights in RO/BG sit on minor roads. `/api/ai/trip-guide` also gets `via`, `car_comfort`, `leaves_at_night`, `max_day_driving_h` and, for scenic trips, `along` (six points the server reverse-geocodes); the model writes a "why this route" section, a "worth a stop" section of well-known sights (no invented hours, prices or festival dates) and human-load advice (driver swaps, small car, night start).

- Interesting places: the form's "Интересен път" (`pace: "scenic"`, label in `scripts/i18n-features.json`) shows a "Show interesting places" button in the plan sheet (`components/plan/PlanSights.tsx`); nothing is searched until it is pressed. `POST /api/ai/sights` (`lib/ai/sights.ts`, `lib/sights/*`): the model suggests well-known sights near eight reverse-geocoded points on the road, each is looked up with the geocoder and kept only when it is found within 25 km of the road (`lib/sights/validate.ts`), with distance off the road, kilometre along it, extra minutes and, when a planned rest is within 25 km, a note that it could replace it. The driver adds or removes each place (`useRouteStore.sights`); the chosen ones go into the AI trip text (`chosen_sights`, kept per plan and choice) and into the PDF as short stories (`history` and `why`). Hours and prices are never given.

- Bad road, health limit, long-day nudges: community pin category `bad_road` ("Лош път", 30 days; needs `drizzle/0010_bad_road_pin.sql` once, `alter type community_pin_category add value 'bad_road'`; until then posting that category fails). Pins near the route reach the AI trip text as `bad_roads` ("reported by drivers"). `healthDayLimitH` is 10 h, or 8 h with children: it caps the planned day (`drivingDayLimits`), raises trip-mode notices `longDaySoon` (1 h before) and `longDay` counted from the last night stop (`lib/trip/notices.ts`), and the push plan carries `day_limit_h`, `arrive_at` and each night's `sleep_min` so `buildPushSchedule` sends two nudges per day (at 85% driving share of the clock), only while the plan still has that day going. The AI text always has a short safety section; for RO/BG it warns about poor surfaces and night driving.

- Route history: every plan a signed-in driver generates is recorded once (`components/profile/HistoryRecorder.tsx`, mounted in the app layout) as inputs to run it again plus a short summary (`lib/history/entry.ts`), not the 2.5 MB plan: `GET/POST/DELETE /api/history`, `DELETE /api/history/[id]`, table `route_history` (`drizzle/0011_route_history.sql`, needed once), newest 30 kept. The profile's "История на маршрутите" panel (`RouteHistoryPanel.tsx`) reopens one (fills the form and recalculates with today's data), saves it as a favorite, deletes it, and compares two (second against first). Without the table or a database the panel says history is not set up.

- Bad road as a stretch: a `bad_road` pin can carry `end_coords` (columns `end_lat`, `end_lng` on `community_pins`, `drizzle/0012_pin_segment.sql`; APPLY IT BEFORE DEPLOYING, because every pin query now selects the columns). The composer asks for the end with a second map tap (`useCommunityStore.segmentPending`, max 50 km, `MAX_SEGMENT_KM`), the map draws a dashed line (`CommunitySegments`), `communityAlongRoute` counts a stretch only when both ends are within 6 km of the road and gives it `from_km`/`to_km` and a time cost of 0.4 min per km (max 20), the plan gets a warning, and the AI text sees "from km X to km Y".

- Night swap and scenic tuning: preference `night_mode` (`sleep` | `swap`, form select shown with two or more drivers). With `swap` the day limit is seven hours a driver (14 h for two, 16 h for three; 12 h with children; `healthDayLimitH`), no extra +2 h, and the plan carries `driver_plan` (`lib/planner/driver-plan.ts`: the wheel goes round at the first stop after about 150 driving minutes, and to the next driver after a night's sleep; `DriverPlanView` shows it, the AI text gets `driver_plan`). Hidden tuning preference for the scenic road: `scenic_strength` (use_highways, default 0.3). Tried and dropped: a scenic road only for the last share of a trip (it came out the same road).

- Tips by country: `lib/constants/country-tips.ts` (`COUNTRY_TIPS`, one curated tip per country and topic, four languages, no exact law claims). The Tips page has country chips; a chosen country shows a small card (emergency numbers, winter rule, official road-charge link from the existing tables), its tips, then the general ones. Add a country by adding `tip(...)` rows (it must exist in `EMERGENCY_DATA`; the test checks).

- Settings page `/settings` (sidebar, top bar): theme and language, `LocationSettings` (location + notification permission), "stop notifications on this device" (`DELETE /api/push/subscribe` with the endpoint), device-only switches in `lib/stores/settings.store.ts` (`historyRecording` gates `HistoryRecorder`; `borderWatch` gates the border-wait measuring), clear history / clear this device's data (`LOCAL_DATA_KEYS`), a plain-words retention list, and the account card: `GET /api/account` downloads every row stored for the driver as JSON, `DELETE /api/account` (`{confirm:true, delete_posts}`, rate limited) removes the user (profile data and sessions cascade). Community pins and comments lose their author (`set null`) unless `delete_posts` is true. No new SQL.

- Map layer sub-options (`LayerPanel`): `useMapStore.communityCategories` (empty = all; filters `CommunityPins` and `CommunitySegments`), `fuelFilter` (fuel types for the fuel layer, minimum kW and plug family for the EV layer, same helpers as the fuel page in `lib/fuel/filters.ts`), and `showOnly(key)` ("Only this" turns every other layer off). Incident groups keep living in the legend.

- Travel windows (`lib/planner/day-window.ts`, `wakeAt` in `breaks.ts`): a start from 03:00 to 18:00 local drives to about 22:00 or the driver's maximum (`max_driving_hours`, default 12), whichever comes first; the night is the 22:00-05:00 window, sleep aims at 8 h and is 6 h at least (warning under 8). The 10 h / 8 h with children level (`healthDayLimitH`) is only a warning now (`planner.warnings.longDay`), except for swapping drivers, where it is the cap. A start from 18:00 to 03:00 with two or more drivers is planned as `night_mode: "swap"` (stint `NIGHT_STINT_MIN` 330 min, the daytime stop is the longer rest); one driver gets `nightAlone`. With a via point and no border the driver asked for, no border is added as a through point (`viaDecidesRoad` in `run-plan.ts`). Fuel stops skip lorry-only depots (`isTruckOnlyStation`).

- AI plan on its own page (`/plan/ai`, `components/plan/AiPlanView.tsx`): the plan sheet shows facts only and ends with a "Create a plan with AI" link; opening the page writes the plan once per plan (`/api/ai/trip-guide`, no "why this route" section any more), lists each overnight stop with `StayOptions` (auto-loaded) and one icon button per platform (Booking.com, Airbnb, Tripadvisor, Google Maps; `lib/utils/stay-links.ts`, links are rebuilt on the device when `/api/stays` is offline). With a pet the searches carry each platform's pet filter (Booking `nflt=hotelfacility=4` is unverified, Airbnb `pets=1`) and a note says to switch it on by hand if it does not apply. The "why this route" part of the plan sheet is `RouteCompare` (`lib/planner/route-compare.ts`): what speaks for the first choice, for the alternative, and what the alternative costs, from the numbers in `plan.route_options`.

### Costs, return date and the trip balance

- `lib/costs`: `estimatePlanCosts` turns the plan into rough costs (`plan.costs`): fuel or charging from the distance, the consumption and each country's pump price (`kmByCountry` splits the route by country); a vignette per country picked for the trip length (one product for the whole stay or one short one for each pass, whichever is cheaper); distance tolls (a per-km rate on 80% of the kilometres); a Danube bridge is named but not counted (no confirmed fee); nights by rooms for the adults; meals and coffee for adults and children. `lib/costs/price-tables.ts` is a dated snapshot (`PRICES_CHECKED_ON`), never a live price: edit it when tariffs change, and the page says "a guide, not a quote".
- `return_at` (the form's "Return date") is optional on `POST /api/plan`; with it the costs include the way back on the same road and the vignettes cover the whole stay. It is kept on the plan and sent again by replans.
- Fuelo prices come in national money: `lib/fuel-prices/to-eur.ts` converts them (dinar and denar at fixed rates, the rest from the ECB rates); a currency with no rate is left out. A fuel stop with no station price shows the country average, labelled as an average.
- "My checklists" also holds a trip balance (`drizzle/0009_checklist_trip_log.sql`, `trip_log`): the odometer at the start and the end, the real expenses by category, and the estimate stored when the plan was saved; `lib/costs/ledger.ts` sums it and compares.
- Map: the community "new signal" sheet is dismissible (the map page's `main` is `pointer-events-none`, so anything fixed inside it must opt in with `pointer-events-auto`). Speed cameras show from zoom 6 with clustering; the camera box is snapped outward so a zoomed-in view is never an empty box.

### Keys-only readiness

- Code is ready for operators to paste env vars only (+ one-shot Neon SQL).
- `GET /api/config/status` — booleans/labels, never secret values
- `GET /api/health` — liveness, `database_configured`, `database_reachable`, `auth_tables_ready`
- UI: `/setup`, profile “Услуги и ключове”, sidebar → Настройка
- Apply DB once: `drizzle/0001_better_auth_and_community.sql`, then `0002`, `0003`, and the later numbered files up to `0008_user_checklists.sql` (see `docs/SETUP.md`). Hobby crons: Nakordoni `20 5 * * *` (Pro may use `*/15 * * * *`; production 401 without `CRON_SECRET`), warm-geo `0 8 * * *` (Pro may use `*/10 * * * *`; stays open when the secret is unset), and fuel bulletin `30 6 * * *` (production 401 without `CRON_SECRET`). `TANKERKOENIG_API_KEY` is optional. `OCI_POI_BASE_URL` is optional when `OCI_GEO_BASE_URL` is set.
- Template: `.env.example`

### Dev commands

See `README.md` / `package.json`: `npm run dev`, `npm run lint`, `npm test`, `npm run build`.

### Gotchas

- Do not copy `.env.example` blindly into `.env.local` for production builds of map style — empty `NEXT_PUBLIC_*` values are treated as unset by helpers, but prefer omitting blank vars.
- `AuthGuard` is a no-op shell; gate writes with `RequireAuth` / session checks.
- One account system: Better Auth on Neon (`DATABASE_URL`). Without it, writes return 503.
- On Vercel preview, leave `BETTER_AUTH_URL` unset so auth uses `https://$VERCEL_URL`.
- Google and Apple buttons appear only when both keys for that provider are set.
