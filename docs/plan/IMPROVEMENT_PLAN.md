# BG Road Navigator improvement plan

> **For agentic workers:** Implement these pull requests in order, one PR per branch. Do not start the next PR in the same branch. Do not spawn subagents. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A driver can plan a Europe–Bulgaria/Turkey drive, compare one real second route, trust the vignette and wait numbers, and use the app in Bulgarian (default), Turkish, English, or Romanian.

**Architecture:** Keep the deterministic planner in `lib/planner/run-plan.ts`. The second route is the next border corridor that actually leaves the chosen road, with a Valhalla alternate only when no border corridor diverges. Client copy stays in `lib/i18n` (no new i18n library). Official vignette URLs stay in `lib/constants/vignettes.ts`. No new paid APIs and no shop scraping.

**Tech stack:** Next.js 16.3.4, React 19, MapLibre, Zustand, Zod 4, Vitest 3, drizzle/Neon, Valhalla + Photon when `OCI_GEO_*` is set, otherwise OSRM + Nominatim.

## Global constraints

- Running cost cap is about €30/month. Do not add a paid API, do not turn on public Overpass (`POI_OVERPASS_FALLBACK` stays off unless an operator already set it), and do not scrape vignette shops.
- Operators paste env vars themselves. Never commit secrets. `GET /api/config/status` stays booleans and labels.
- Browse without login. Auth stays Better Auth on Neon. Writes stay 503 without `DATABASE_URL`.
- No live in-app turn-by-turn. Maps handoff stays in `lib/utils/maps-handoff.ts`.
- Bulgarian is the default locale. Do not follow `Accept-Language` on first visit.
- Do not add npm dependencies.
- Tests are Vitest: `npm test`. Lint is `npm run lint`. Do not add Playwright in these PRs.
- A favorite `plan` JSON may be a planner result or `{ kind: "bg-road-favorite-v1", inputs, result }`. New response fields must be optional so old saved plans still open.
- When a PR changes a rule written in `AGENTS.md`, update that bullet in the same PR.
- Tree this plan was written against: `613c507` (merge of PR #23). The 15 Nov 2026 UX reviews describe production. One review string, "участъка с чести катастрофи", is not in this tree. Search before editing it. If `rg` finds nothing, skip it. Do not invent an accident dataset.
- UI copy is for drivers. Do not show Neon, stable IDs, "the button does not go out", Booking, Airbnb, or "прозорец".

## Locked decisions

1. **One alternative, or an honest none.** The alternative is the next-best border route that diverges (defined in PR 6). A Valhalla alternate that rejoins (Berlin → Sofia rejoining at Budapest) is not offered. Sofia → Plovdiv and any same-country hop get one line and a sentence, not a fake second line.
2. **Picking rebuilds the plan.** The first response draws both lines and fills both cards from data already fetched (direct route + up to 3 border vias). Places, weather, and the checklist are built for the chosen line only. A second full plan runs when the driver picks the other card.
3. **Typed text is not a place.** Origin and destination start empty. A plan is created only from a suggestion tap or a corridor chip. Submit stays on `/route` until that is true.
4. **One clock for durations.** Trip length uses `formatClockDuration` (`1 д 3 ч`). Corridor chips do not show `~18ч`.
5. **Overnight means a sleep.** If the drive is longer than the day limit, the clock stops at the overnight stop and starts again at 08:00. Driving minutes do not include sleep.
6. **Wait numbers name their clock.** Home and `/borders` show the wait for now. The plan shows the wait at arrival. Same crossing, same source rules (`expectedWait`). A difference that is only the hour is labeled, not presented as two facts.
7. **Vignette prices are not guessed.** Validity text is allowed only when copied from the official page already linked, with `checked_on`. A missing price stays missing. Do not add unknown amounts as zero into a trip total.
8. **Locales are four catalogs of the same `Messages` shape.** `bg`, `en`, `tr`, `ro`. Missing keys are a TypeScript error. German is out of scope (a reviewer asked; the owner asked for Turkish, English, and Romanian).

## Coverage of the 15 Nov review

| Finding | PR |
|---|---|
| Typed city not chosen still plans London → Sofia and leaves `/route` | 1 |
| "Накъде" prefilled with София | 2 |
| Planner below the corridor chips; too many options | 2 |
| Pale "Изчисляване…" button | 2 |
| "27 часа" vs "1 д 3 ч"; two plan titles | 2 |
| Suggestion list off-screen, sticks after scroll, duplicates, Sofia in Moldova first | 2 |
| `datetime-local` shows `mm/dd/yyyy` | 2 |
| Serbia "виньетка", North Macedonia "за ЕС граждани", BG shop URL, RO deep link, RS/HR labeled as shops | 3 |
| Plan vignette list easy to misread (AT/SI reported missing while the API returned them) | 3 |
| Corridor `~18ч` vs computed 14 ч 40 мин | 2 |
| Kapitan Andreevo 50 vs 40; break "3–4 часа" vs 135 мин vs "2–2.5 часа" | 4 |
| Overnight tag but same-day arrival; departure defaults to now | 5 |
| No second route to choose | 6 |
| Developer sentences, dead "Резервирай", "в Neon" on the driver setup screen, setup title "Настройка"/"Услуги" | 2 and 7 |
| Map with no legend, traffic dots at country zoom, clipped border chips, route under the plan panel, tips page with the map behind it | 7 |
| Dark theme ignores the system preference | 7 |
| No vignette price; fuel average beside "няма данни"; `/fuel` shows 0 stations; no trip total | 8 |
| Thin pet note; copy assumes an EU citizen | 8 |
| Repeated "Почивка" / "Няма почасова прогноза" | 4 |
| No TR/EN/RO | 9 then 10 |
| Small type and tap targets on chips | 2 |
| Bilingual basemap labels ("Montana Монтана") | 7, explain only. Do not commission a new tile style |

## Out of scope

- Station-level fuel prices for countries that have no key already wired (Tankerkoenig and E-control stay as they are).
- A hotel booking link. Remove the dead button. Do not add Booking or Airbnb.
- German locale, accounts, community writes, and turn-by-turn.
- Rewriting Photon or Valhalla. Ranking tweaks in PR 2 are local score changes only.
- Changing emergency phone numbers (Greek roadside `179` included). The reviews did not prove those numbers wrong.

---

## PR 1 — Never plan a place the driver did not pick

**Goal:** Typing "Мюнхен" and "Пловдив" without a tap cannot route London → Sofia, and the form stays on `/route` with the typed text.

**Depends on:** nothing. Do this first.

**Files:**

- Modify: `app/(app)/route/page.tsx` (initial state around the `useState` calls at lines 73–82, and `runCalculation`)
- Modify: `components/route/LocationSearchInput.tsx`
- Modify: `components/route/PlanningForm.tsx` (the `key={origin?.id}` remount and the submit button)
- Modify: `lib/i18n/index.ts` (`planning.missingEnds`, add `planning.pickFromList`)
- Create: `lib/route/place-commit.ts`
- Test: `lib/route/place-commit.test.ts`

**Data / API:** none.

**Implementation:**

- [ ] **Step 1.** Add `lib/route/place-commit.ts`:

```ts
import type { RoutePoint } from "@/types/route.types";

/** A typed string is not a place. Null means the field is empty or edited. */
export function committedPlace(
  selected: RoutePoint | null,
  query: string
): RoutePoint | null {
  if (!selected) return null;
  if (query.trim() !== selected.label.trim()) return null;
  return selected;
}
```

- [ ] **Step 2.** Write the failing test first.

```ts
import { describe, expect, it } from "vitest";
import { committedPlace } from "@/lib/route/place-commit";

const london = {
  id: "london",
  label: "Лондон",
  coords: { lng: -0.12, lat: 51.5 },
  source: "curated" as const,
  countryCode: "GB",
};

describe("committedPlace", () => {
  it("drops the selected city when the field text changed", () => {
    expect(committedPlace(london, "Мюнхен")).toBeNull();
  });

  it("keeps the city when the text is exactly the picked label", () => {
    expect(committedPlace(london, "Лондон")).toBe(london);
  });

  it("is empty when nothing was picked", () => {
    expect(committedPlace(null, "Пловдив")).toBeNull();
  });
});
```

Run: `npx vitest run lib/route/place-commit.test.ts`  
Expected before the helper exists: FAIL, cannot find module.

- [ ] **Step 3.** Fresh `/route` state is `origin = null` and `destination = null`. Keep restoring `activeRoute` and `replanDraft` when those exist. Delete `toRoutePoint("london")` and `toRoutePoint("sofia")` from the initializers.
- [ ] **Step 4.** `LocationSearchInput` takes `onQueryChange(query: string)`. Call it from `onChange` and when a suggestion is chosen (with the picked label). Do not call `onSelect` from `onChange`.
- [ ] **Step 5.** Remove `key={origin?.id ?? "origin-empty"}` (and the via/destination keys) from `PlanningForm`. Those keys remount the input and wipe typed text when the point becomes null. Corridor chips and replan already call `onOrigin` / `onDestination`; the input must also update its text when `value?.label` changes from outside. Add this effect:

```ts
useEffect(() => {
  setQuery(value?.label ?? "");
}, [value?.id, value?.label]);
```

- [ ] **Step 6.** `runCalculation` uses `committedPlace(origin, originQuery)` and the same for destination and via. If either end is null, set `routeError` to `m.planning.pickFromList` (Bulgarian: "Изберете града от списъка под полето. Написан текст още не е място."), leave `calculating` false, and do not `fetch`. Do not `router.push`.
- [ ] **Step 7.** The submit button's disabled rule uses the committed places, not the stale `RoutePoint`. The button stays enabled when both ends are committed and different. When they are not, the click still runs the error path if you keep the button enabled so the message is visible. Prefer enabled + alert, because a disabled button hid the failure from Ivan.
- [ ] **Step 8.** `router.push("/")` stays only after a non-null plan, and only then. A failed geocode or a missing pick never navigates.

**Acceptance:**

- A fresh load of `/route` has empty "Откъде" and "Накъде". Placeholder "напр. София" may stay. The value must not be София.
- Type over a corridor chip's cities without tapping a row, press "Изчисли маршрут": the URL stays `/route`, the typed text remains, and the alert is `pickFromList`.
- Tap "Мюнхен, Германия" and "Пловдив, България", then submit: the request body labels are those cities.
- `npm test` passes.

**Risks:** Corridor chips and saved-route replan must still fill the fields. The new effect must not clear a just-picked place (query and label match, so `committedPlace` keeps it).

**Do not:** Geocode the raw string on submit. That is what made the wrong city win.

---

## PR 2 — The form starts with the trip

**Goal:** On a phone, "Откъде", "Накъде", and "Изчисли маршрут" are the first things in the planner. Options sit under "Още опции". The suggestion list is on screen. Durations use one format. Driver-facing junk sentences are gone.

**Depends on:** PR 1.

**Files:**

- Modify: `app/(app)/route/page.tsx` (move the corridor block under the form; wrap it in `<details>`)
- Modify: `components/route/PlanningForm.tsx` and `components/route/PreferenceFields.tsx`
- Modify: `components/route/LocationSearchInput.tsx` (popover placement, scroll close, dedupe)
- Modify: `lib/constants/european-cities.ts` (`searchCuratedCities` sort)
- Modify: `lib/api-clients/photon.ts` (`scoreFeature`)
- Modify: `lib/api-clients/photon.test.ts`
- Modify: `lib/i18n/index.ts`
- Modify: `lib/planner/assemble.ts` (`reasonFor` overnight sentence)
- Modify: `components/plan/StopTimeline.tsx` (hide flag sentence, remove reserve button)
- Modify: `components/plan/PlanDetailSheet.tsx` and `components/plan/PlanItineraryView.tsx` (one title)
- Modify: `components/map/RouteBottomSheet.tsx` (use `formatClockDuration`)
- Modify: `components/setup/UserServicesPanel.tsx` (drop "Neon" in `whenOn`)
- Modify: `components/layout/TopBar.tsx` and `app/(app)/setup/page.tsx` (one title for the driver view)
- Modify: `lib/planner/itinerary.ts` only if a caller still needs `formatDuration` for a computed trip. Stop using `formatDuration` for computed minutes.

**Data / API:** none.

**Implementation:**

- [ ] **Step 1. Order.** In `app/(app)/route/page.tsx`, render `PlanningForm` first. Under it, a closed `<details>`:

```tsx
<details className="mb-6">
  <summary className="cursor-pointer text-sm font-semibold text-[var(--waze-text)]">
    {m.planning.corridors} ({TRAVEL_CORRIDORS.length})
  </summary>
  <div className="mt-3 flex flex-wrap gap-2">
    {/* existing corridor buttons, without estimatedHours */}
  </div>
</details>
```

Chip label is `corridor.label` only. Delete the `· ~{estimatedHours}` suffix. Leave `estimatedHours` on the data object so other imports still type-check. Do not display it.

- [ ] **Step 2. Primary fields.** Visible without opening anything: from, to, departure, the alert, the calculate button. Move via, fuel, and the whole `PreferenceFields` into a second closed `<details>` whose summary is `m.planning.moreOptions` ("Още опции"). Defaults are unchanged (`fuel` 80, `DEFAULT_TRIP_PREFERENCES`), so a driver who never opens the section still sends today's defaults.
- [ ] **Step 3. Departure field.** Stop treating an empty box as "now" in the form. Prefill with the next 08:00 in `Europe/Sofia`, as a `datetime-local` value `YYYY-MM-DDTHH:mm`. If that instant is already past today, use tomorrow. Show `m.planning.departProposed` under the field: "Предложено е 08:00. Сменете часа, ако тръгвате по друго време." Always submit that value (`depart_at` present). Add a line next to the native control formatted with `Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" })` so the driver sees `16.11.2026, 08:00` even when the browser paints `mm/dd/yyyy`. Set `lang="bg"` on the input until PR 9, then use the active locale.
- [ ] **Step 4. Suggestions.** In `LocationSearchInput`, after the list opens, if `list.getBoundingClientRect().bottom > window.innerHeight - 8`, add `bottom-full mb-2` instead of `mt-2` so the list opens upward. Close the list on `window` `scroll` (capture true) and on `blur` after a 150ms delay so a tap on a row still registers. Dedupe in `mergePlaces` by rounded coordinates (already there) and by `${label.toLocaleLowerCase("bg")}|${countryCode ?? ""}`.
- [ ] **Step 5. Rank.** In `scoreFeature`, when `flags.shortCity` is true and the normalized name equals the normalized query, add 40 if `countrycode` is one of `BG, TR, DE, AT, RO, RS, HU, HR, SI, SK, CZ, GR, MK, CH, NL, BE, FR, IT, ES, GB`. Do not subtract Moldova into hiding. Exact name match still beats a partial. In `searchCuratedCities`, sort an exact label match before a partial, and sort `countryCode === "BG"` first among equals. Extend `lib/api-clients/photon.test.ts` with a fixture: two features named "Sofia", one `countrycode: "MD"` with a higher Photon rank, one `countrycode: "BG"`. Expect BG first.
- [ ] **Step 6. Loading.** On the calculate button, when `calculating` is true, do not use `disabled:opacity-50` (white text on a pale button). Use `aria-busy="true"`, keep the accent background, and set the label to `m.planning.calculating`. Add a status paragraph: "Изчисляваме маршрута. Обикновено е готово за под минута."
- [ ] **Step 7. One duration.** Replace trip-length calls of `formatDuration` in `RouteBottomSheet`, the route summary, and stop rows with `formatClockDuration`. The large figure in `RouteBottomSheet` is that same string, not `Math.floor(minutes / 60)` plus the word "часа". `formatDuration` may remain for any rough estimate that is not a computed route. After PR 2 no computed route uses it.
- [ ] **Step 8. One plan title.** Both the sheet and the itinerary view use `m.sheet.title` ("План на пътуването"). Change `m.itinerary.title` to the same Bulgarian sentence so a translator in PR 10 only has one idea.
- [ ] **Step 9. Driver copy, now.**
  - `m.sheet.flagNeedsPlace`: stop rendering the paragraph in `StopTimeline`. The flag button stays disabled when `place_id` is null. No explanation sentence.
  - Delete the "Резервирай" button and `m.hotel.reserveHint` from `HotelBlock`. Keep the lodging note.
  - `reasonFor` overnight sentence becomes "Тук се спи. На сутринта пътят продължава." (PR 5 makes that sentence true.)
  - `UserServicesPanel` postgres `whenOn`: "Вход, любими, маршрути и сигнали се пазят в профила." Operator setup (`useOperatorMode() === true`) may still say Neon and SQL. Driver setup must not.
  - Top bar title for `/setup` is "Услуги". The operator `PageHeader` stays "Настройка". Use `useOperatorMode` in `TopBar`.
- [ ] **Step 10. Tap size.** Corridor chips and the calculate button use `min-h-11` and at least `text-sm`. Do not restyle the map controls in this PR.

**Acceptance:**

- At 390×844 the first screen of `/route` contains the two fields and the button. Corridors and preferences are closed.
- Chips do not contain `~18ч` or any hour number.
- A 27-hour route prints `1 д 3 ч` in the bottom sheet and in the plan stats.
- Photon test: BG Sofia ranks above MD Sofia on an exact name match.
- The reserve button is gone. The flag paragraph is gone. The driver setup screen has no "Neon".
- `npx vitest run lib/api-clients/photon.test.ts lib/planner/itinerary.test.ts` passes.

**Risks:** The suggestion effect that syncs `value.label` into the input can fight typing. Only sync when `value?.id` or `value?.label` changes, not on every render. Opening `<details>` must not reset `prefs` state (do not conditionally mount in a way that remounts `useState`; CSS hidden is worse than keeping the children mounted inside `<details>`, which does not unmount).

**Do not:** Change planner math in this PR.

---

## PR 3 — Vignette and toll records match the road

**Goal:** The official link, the kind (vignette vs per-km toll), and the emergency note for a country say the same thing. The plan lists every charge for the countries the line crosses.

**Depends on:** nothing in the planner math. Can follow PR 2. Do not start it before PR 1 is merged if both touch `lib/i18n/index.ts`. They do not have to. This PR should not need `lib/i18n` except the checklist label.

**Files:**

- Modify: `lib/constants/vignettes.ts`
- Modify: `lib/constants/vignettes.test.ts`
- Modify: `lib/constants/emergency-numbers.ts`
- Modify: `lib/constants/emergency-numbers.test.ts` (new)
- Modify: `components/vignettes/VignetteLinks.tsx`
- Modify: `components/plan/PlanChecklist.tsx`
- Modify: `lib/i18n/index.ts` (`checklist.official` split into shop vs info)
- Modify: `lib/planner/checklist.ts` only if the item needs `link_role` on the checklist row
- Modify: `lib/planner/types.ts` (`ChecklistItem` gains optional `link_role`)

**Data / API:**

Add on `VignetteLink`:

```ts
link_role: "shop" | "info";
```

No price field in this PR.

| Code | URL | link_role | Note change |
|---|---|---|---|
| BG | `https://web.bgtoll.bg/` | shop | Info portal stays mentioned as `https://www.bgtoll.bg/` inside `notes_bg` only. The button opens the shop. |
| RO | `https://portal.etoll.ro/vinieta-ro` | shop | Say the rovinieta is sold through eToll / TollRo. Do not describe the page as a distance toll. |
| RS | unchanged putevi-srbije URL | info | Keep "Няма винетка…" |
| HR | unchanged hac.hr URL | info | Keep "Няма винетка за леки коли…" |
| TR | unchanged HGS URL | shop | Keep the foreign-plate sentence. |
| Others | unchanged | shop | |

`ChecklistItem` gains `link_role: "shop" | "info" | null`. The row label is `m.checklist.officialShop` ("Официален магазин") or `m.checklist.officialInfo` ("Официална информация"). Delete the single `m.checklist.official` ("Официален продавач") after call sites move.

Emergency notes, same file, spelling **винетка** (one н). Replace every `виньетка`.

- Serbia `notes_bg`: "Няма винетка. Магистралите се плащат по километър на бариерите."
- North Macedonia `notes_bg`: "Няма запис за винетка в списъка на приложението. Пътната такса следва регистрацията на колата, не гражданството на водача."
- Bulgaria `notes_bg`: point at `https://web.bgtoll.bg/` for the purchase. Keep 112 / 166 / 150 / 160.
- Austria, Hungary, Slovenia, Switzerland, Czechia, Slovakia, Moldova: only the spelling change, unless the sentence says a vignette is mandatory and `getVignetteByCountryCode` agrees. Do not invent new rules.

Switzerland's shop may return 403 to a headless browser. Leave the URL. Add to `notes_bg`: "Ако страницата не се отвори, отворете я в обикновен браузър."

**Plan checklist:** `PlanChecklist` renders vignettes and tolls in one section titled "Винетки и тол по този път", each row showing the kind. Do not drop a country because it is a toll. Keep the underlying arrays (`checklist.vignettes`, `checklist.toll_sections`) so saved plans and tests that read them still work. The UI is what merges them.

`getRouteTolls` is already correct when `countriesAlongRoute` is correct. The 15 Nov API check for Köln → İstanbul returned AT, SI, BG and tolls HR, RS, TR. Add a fixture test that those six links all become rows. If you find a geometry that crosses Austria and the country list omits `AT`, fix the sampler in `lib/geo/countries-along-route.ts` and add a regression fixture. Do not hardcode Köln → İstanbul countries.

**Tests:**

```ts
expect(getVignetteByCountryCode("BG")?.official_url).toBe("https://web.bgtoll.bg/");
expect(getVignetteByCountryCode("RO")?.official_url).toBe(
  "https://portal.etoll.ro/vinieta-ro"
);
expect(getVignetteByCountryCode("RS")?.link_role).toBe("info");
expect(getVignetteByCountryCode("HR")?.link_role).toBe("info");
expect(getVignetteByCountryCode("BG")?.link_role).toBe("shop");
```

Update the old assertion that RO is `https://etoll.ro`.

```ts
import { EMERGENCY_DATA } from "@/lib/constants/emergency-numbers";

it("does not use the Russian spelling or claim a Serbian vignette", () => {
  const blob = EMERGENCY_DATA.map((row) => row.notes_bg).join("\n");
  expect(blob).not.toContain("виньетка");
  expect(EMERGENCY_DATA.find((row) => row.country === "Serbia")?.notes_bg).toMatch(/Няма винетка/);
  expect(EMERGENCY_DATA.find((row) => row.country === "North Macedonia")?.notes_bg).not.toMatch(/ЕС граждани/);
});
```

**Acceptance:** `/vignettes` and the plan use the shop URL for Bulgaria, the rovinieta deep link for Romania, and "Официална информация" on Serbia and Croatia. `/emergency` Serbia no longer says a vignette is mandatory. A plan whose tolls include AT and SI shows both in the merged section.

**Risks:** Saved clients that only read `checklist.vignettes` still receive vignette countries. Toll countries stay in `toll_sections`. The UI change is additive.

**Do not:** Add euro amounts. Do not change phone numbers.

---

## PR 4 — One source for waits and breaks

**Goal:** A wait on the home chip and a wait in the plan are the same function at two clocks. Rest advice uses the planner interval, not a second slogan.

**Depends on:** PR 3 can be merged or not. Do not edit `emergency-numbers.ts` here.

**Files:**

- Modify: `lib/planner/wait.ts` (export the local-hour lookup the borders page can call)
- Modify: `lib/api-clients/border-scraper.ts` (`buildFallbackStatus` and the live merge)
- Modify: `app/(app)/page.tsx` (chip label)
- Modify: `components/borders/BorderWaitBadge.tsx` (optional caption)
- Modify: `components/borders/BorderCard.tsx` (stop wrapping "Коли 30 мин"; put the vehicle waits in a row that can wrap as whole pills, `whitespace-nowrap` on each pill)
- Modify: `lib/constants/travel-tips.ts` (the 3–4 hour tip)
- Modify: `lib/planner/assemble.ts` (rest reason, repeated forecast sentence)
- Modify: `components/plan/PlanDetailSheet.tsx` (weather empty copy once)
- Modify: `lib/planner/pick-place.ts` (stable tie-break)
- Test: `lib/planner/wait.test.ts` if present, else `lib/planner/breaks.test.ts` and a new `lib/planner/wait-clock.test.ts`
- Test: `lib/planner/pick-place.test.ts`

**Rules:**

- Home and `/borders` ask for the wait at `now`. The plan asks for the wait at the ETA already computed in `run-plan.ts`. Both call `expectedWait`.
- Kapitan Andreevo, Lesovo, and Malko Tarnovo are Turkish-market crossings. `isCrossingLicensed` is false unless `NAKORDONI_LICENSED_MARKETS` includes market 14. Unlicensed crossings use the local `typical_wait_minutes` table, on the home page as well. Do not show a Nakordoni live number for an unlicensed crossing on the home chip while the plan shows the local table. That split is the 50 vs 40 bug when the hours also differ.
- When the hours differ, the numbers may differ. Label them. Home chip: "изчакване сега". Plan row already has `label_bg` and "при пристигане" style copy in `m.sheet.borderWait`. Add the clock: home badge subtitle is the current hour, plan subtitle is the ETA hour. Do not force them to one number.
- `typical_wait_minutes[hour]` is indexed in Europe/Sofia. Use that zone in `expectedWait` for the local table (it already takes `timeZone`). Pass `"Europe/Sofia"` from `buildFallbackStatus` via a shared helper:

```ts
export function localTypicalMinutes(
  table: number[] | null,
  at: Date,
  timeZone = "Europe/Sofia"
): number | null
```

Use it inside `unlicensedWait` and from `buildFallbackStatus`. Do not duplicate the hour extraction.

- Tips title `rest-every-4h`: change to "Почивка на около 2 часа и 15 минути". Body: "Планът спира през този интервал. На път над 30 часа заложете и нощувка или втори водач." This matches `DEFAULT_TRIP_PREFERENCES.break_every_min` (135) and `reasonFor`'s "2–2.5 часа". One number in the product: 135 minutes. Children still shorten it through `effectiveBreakEveryMin`. The tip states the default, not the shortened one.
- Rest stops with no place name keep the kind "Почивка" but the reason sentence is stored once. In `StopTimeline`, if this stop's `reason` equals the previous stop's `reason`, do not render the paragraph again.
- Weather: if every segment's summary is the empty-forecast sentence, render `m.sheet.weatherEmpty` once above the list and do not repeat it on each row. If you need a per-segment flag, add `summary_bg: ""` when there is no hourly point, and let the UI skip empty summaries. Do not change temperatures that exist.
- `pickPlace`: when scores tie, sort by `place.id` ascending before taking the winner. Same line, same places, same winner.

**Tests:**

- `localTypicalMinutes` on Kapitan Andreevo's table at 07:00 Europe/Sofia is `40`, and at 10:00 is `90` (read the table in `lib/constants/border-crossings.ts`: index 7 is 40, index 10 is 90). Lock those two expects to the table, not to memory.
- Two places with equal scores and ids `"b"` and `"a"`: `pickPlace` returns `"a"`.
- A breaks fixture with four rests does not change stop count. This PR does not delete rests.

**Acceptance:** For an unlicensed crossing, the home chip and a plan that arrives in the same hour show the same minute value. The tips page no longer says 3–4 hours. Identical rest reasons do not repeat down the sheet.

**Risks:** Hiding Nakordoni on the home chip for Turkey is a behavior change the license already requires in the planner. Do not hide it for Kalotina or Kulata (those markets stay licensed).

**Do not:** Add a new wait table.

---

## PR 5 — Overnight is a real night

**Goal:** With "Да, планирай нощувка" and a 10.5 h day, a Berlin → Sofia plan that takes about 15 h does not arrive the same evening. The clock stops overnight and starts at 08:00.

**Depends on:** PR 2 (the form already sends a morning `depart_at`). PR 4 (rest copy).

**Files:**

- Modify: `lib/planner/breaks.ts` and `lib/planner/breaks.test.ts`
- Modify: `lib/planner/assemble.ts`
- Modify: `lib/planner/types.ts` (`PlanStop.sleep_min`, `TripPlannerResult.route.arrive_at`)
- Modify: `lib/planner/run-plan.ts` (pass the sleep into ETAs)
- Modify: `components/plan/PlanDetailSheet.tsx` and `components/plan/StopTimeline.tsx`
- Modify: `lib/i18n/index.ts`
- Test: `lib/planner/run-plan.test.ts` if it can build a long drive without network. Prefer a pure function tested in `breaks.test.ts` plus a small ETA helper test.

**Data / API:** Optional fields, so old plans still parse.

```ts
interface PlanStop {
  sleep_min: number | null; // null except the overnight stop that splits the day
}

interface TripPlannerResult["route"] {
  arrive_at: string; // ISO, includes sleep. Same as the last stop's eta.
}
```

`duration_min` and `total_min` stay driving and driving-plus-border-wait. They do not include sleep. The arrival stat uses `arrive_at`, not `depart_at + total_min`.

**Algorithm:** Add `applySleepGaps` in `lib/planner/breaks.ts`:

```ts
export interface SleepShift {
  afterDrivingMin: number;
  sleepMin: number;
}

export function sleepShifts(input: {
  driveMin: number;
  overnight: boolean;
  overnightAfterMin: number;
  overnightAtMin: number;
}): SleepShift[]
```

- If `overnight` is false, or `driveMin <= overnightAfterMin`, return `[]`. A 9 h drive with the default 10.5 h limit has no sleep. The sheet says `m.sheet.fitsOneDay` ("Пътят се събира в един ден на шофиране.").
- Otherwise one shift at each overnight anchor `mergeDrivingBreaks` already creates (`overnightAtMin`, then every `overnightAtMin`, while `minute < driveMin - 45`).
- `sleepMin` is 8 hours (`480`). Fixed. Do not look up a hotel checkout time.
- Clock ETA of a point at driving minute `t` is `departAt + t minutes + sum of sleepMin for shifts whose afterDrivingMin < t`.
- The overnight stop's `eta` is the arrival at the stop, before sleep. `sleep_min` is 480. The next stop's `eta` is after the sleep.
- Copy on that stop: "Спите тук. Тръгване на следващия ден в 08:00. Остават {rest} шофиране." Compute 08:00 as the label even if the actual gap is 8 h from an 18:00 arrival (that is 02:00, which is wrong). **Use the later of (arrival + 8 h) and the next local 08:00 in Europe/Sofia.** So an 18:00 arrival sleeps until 08:00 next day (14 h gap, not 8). A 23:30 arrival sleeps until 08:00 (8.5 h). A 05:00 arrival sleeps until 08:00 the same morning only if the gap is at least 8 h; otherwise until 08:00 the next day. Implement that as `wakeAt(arrival: Date): Date` in `breaks.ts` and test these three cases. `sleep_min` is the actual gap, not a constant, once `wakeAt` exists. Minimum gap is 8 h.

**Worked example to lock in a test:** Depart `2026-11-16T06:00:00.000Z` (08:00 in Sofia, winter). Drive 880 min. Overnight anchor at driving minute 600. Arrival at the stop is 18:00 Sofia. Wake 08:00 Sofia next day. Remaining 280 min. Final `arrive_at` is 12:40 Sofia the next day. `duration_min` is still 880. `total_min` is 880 plus border wait, not plus sleep.

**UI:** The arrival tile uses `formatWhen(plan.route.arrive_at)`. Under it, if any `sleep_min` is set, show "Включва нощувка. Шофирането е {formatClockDuration(duration_min)}." The overnight row shows wake time. Remove any sentence that implies the drive continues the same evening.

**Acceptance:** The Berlin-shaped fixture above does not arrive on 16 Nov. `overnight: false` on the same drive arrives the same day. `npm test` covers `wakeAt` and `sleepShifts`.

**Risks:** Weather segments use driving time, not wall clock. Shift their `eta` by the same sleep so a morning-after segment is not labeled the previous evening. One function should apply the shift: call `wake`-aware ETA from both stops and weather. Border ETA inside `run-plan.ts` is a driving fraction used to pick the wait. Keep that as driving time so a border after the sleep uses the next morning's clock. Add the sleep that occurs before the border to `eta` before `expectedWait`.

**Do not:** Call a hotel API. Do not change `max_driving_hours` default (10.5) or `drivers` extra hours.

---

## PR 6 — Two routes, and the driver picks one

**Goal:** Every plan that has a meaningfully different second corridor shows two lines and two cards (km, driving time, border wait, vignettes, tolls). Picking the other card rebuilds the plan for that line. When no second corridor exists, the sheet says so and draws one line.

**Depends on:** PR 1 (picks are real places), PR 3 (toll labels), PR 5 (rebuild must keep the sleep behavior). Do this after those, because a rebuild that reintroduces a same-day overnight is a failed pick.

**Files:**

- Create: `lib/planner/route-options.ts`
- Create: `lib/planner/route-options.test.ts`
- Modify: `lib/planner/run-plan.ts`
- Modify: `lib/planner/types.ts`
- Modify: `app/api/plan/route.ts` (Zod)
- Modify: `lib/planner/favorite-envelope.ts` (strip the unchosen geometry before save)
- Create: `components/plan/RouteChoiceCards.tsx`
- Modify: `components/plan/PlanDetailSheet.tsx`
- Modify: `components/map/RouteLayer.tsx` (click the alternate line)
- Modify: `components/map/MapExperience.tsx`
- Modify: `app/(app)/route/page.tsx` (`setAlternativeRoutes` from the plan option, not from raw Valhalla alternates)
- Modify: `lib/stores/route.store.ts` if a `routeChoice` field is the only way to remember the pick across the rebuild
- Modify: `lib/i18n/index.ts`
- Modify: `AGENTS.md` phase-3 bullet on alternatives (one sentence: the plan offers one divergent alternative and the client rebuilds on pick)

**Do not raise `MAX_VIA`.** The first `runTripPlan` already requests the direct route (Valhalla alternates included when there are exactly two points and tolls/motorways are not avoided) and up to three border vias. Read `direct.alternatives`. Do not call Valhalla again until the driver picks.

**Types:**

```ts
export type RouteChoice =
  | { kind: "border"; border_id: string }
  | { kind: "valhalla_alternate" };

export interface RouteOptionSummary {
  id: "primary" | "alternative";
  role: "primary" | "alternative";
  source: "border" | "valhalla" | "direct";
  border_id: string | null;
  label: string;
  distance_km: number;
  drive_min: number;
  wait_min: number;
  total_min: number;
  countries: string[];
  vignette_codes: string[];
  toll_codes: string[];
  geometry: GeoJSON.LineString;
}

export interface RouteOptionsBlock {
  primary: RouteOptionSummary;
  alternative: RouteOptionSummary | null;
  unavailable_reason:
    | null
    | "same_country"
    | "too_short"
    | "no_divergent_path"
    | "constraints";
}
```

Add `route_options: RouteOptionsBlock` on `TripPlannerResult`. Leave `border.alternatives` as the numeric list it is today.

`POST /api/plan` body gains optional

```ts
route_choice: z
  .union([
    z.object({ kind: z.literal("border"), border_id: z.string().min(1).max(64) }),
    z.object({ kind: z.literal("valhalla_alternate") }),
  ])
  .optional()
```

`kind: "border"` is applied as the preferred border for this request only. Do not write the profile. `kind: "valhalla_alternate"` uses `direct.alternatives[0]` as the chosen geometry when it still diverges. If it does not, ignore the choice and set `unavailable_reason` to `"no_divergent_path"`.

**Divergence** (`lib/planner/route-options.ts`), pure, using `pointAtDistance` and `distanceToPolylineKm` from `lib/planner/line.ts`:

- Sample the candidate every 10 km.
- A sample counts when its distance to the primary line is greater than 15 km.
- `divergentKm = count * 10`.
- The candidate is meaningful when `divergentKm >= 80`, or when the two options use different `border_id` values and `|distance_km difference| >= 40`.

**Which candidate:**

1. If `selectCandidateBorders` returned no candidates, reason is `"same_country"` when the countries match, otherwise `"too_short"` when haversine is under 40 km (the existing gate in `selectCandidateBorders`).
2. Else among scored borders that are not chosen and that have a via route, pick the lowest `totalMin` whose line passes the test. That is the alternative. Its wait is that border's `wait.minutes`. Countries and charge codes come from `countriesAlongRoute` + `getRouteTolls` on that geometry.
3. If none pass, and `avoid_motorways` or `avoid_tolls` is on, reason is `"constraints"`. Do not use Valhalla alternates in that case: `buildValhallaRouteBody` omits them when costing is set, and a detour around tolls must not be compared with a toll road.
4. If none pass and costing is the default, test `direct.alternatives[0]` once. If it passes, source is `"valhalla"`, `border_id` is null, wait is 0 unless a candidate border sits within 12 km of that line (`ON_PATH_KM`), in which case use that border's wait and id for the label only.
5. Otherwise reason is `"no_divergent_path"`.

The primary option is the chosen line (what the plan already builds). Label is `През ${name}` when there is a border, otherwise `Директен път`.

**Cards:** Two buttons in `RouteChoiceCards`, placed above "Защо този маршрут". Each shows label, `distance_km`, `formatClockDuration(drive_min)`, wait minutes with "изчакване", and the charge codes as country chips (vignette vs toll, using `link_role` from PR 3). The selected card has `aria-pressed="true"`. The other card's click POSTs the same origin, destination, via, depart, fuel, and preferences plus `route_choice`, then `setTripPlan` / `setActiveRoute`. While that request runs, both cards are disabled and the status from PR 2 is shown.

Empty alternative: one card, plus `m.sheet.oneRoute` ("За тези две точки няма втори смислен път.") or `m.sheet.oneRouteConstraints` ("С «без тол» или «без магистрали» остава един път.") when the reason is `"constraints"`.

**Map:** `setAlternativeRoutes` receives at most the one alternative geometry. `RouteLayer` draws it as it does today and adds a click handler on `route-alt-0` that calls `onPickAlternative`. `MapExperience` only attaches the click when a plan exists. Fit bounds around both lines: pass the combined coordinate list to `fitMapToRoute`.

**Favorites:** In `buildFavoriteEnvelope`, before storing `result`, if `result.route_options.alternative` exists, set its `geometry` to `{ type: "LineString", coordinates: [] }`. Keep the numbers. The chosen `route.geometry` stays. Old readers ignore `route_options`.

**Tests** in `route-options.test.ts` with hand-built lines (no network):

- Two lines 200 km apart along a 400 km run: `divergentKm >= 80`.
- A line that leaves for 30 km and rejoins: not meaningful.
- Two border options, Kalotina-shaped (shorter, chosen) and Vidin-shaped (110 km longer, 100 km off the line): the alternative is Vidin.
- Same-country inputs: `alternative === null` and reason `"same_country"`.
- `avoid_tolls: true` and a divergent Valhalla alternate: still null, reason `"constraints"`, even if the alternate would have passed.

**Acceptance:**

- A fixture plan with two divergent border routes renders two cards and two GeoJSON lines.
- Picking the second card sends `route_choice.kind === "border"` and the unchosen `border_id`.
- A same-country fixture renders one card and the sentence.
- No extra Valhalla request is added on the first plan (assert by keeping alternative selection a pure function of the routes `runTripPlan` already holds). The only new request is the user's second POST.
- `border.alternatives` is still present.

**Risks:** Large GeoJSON in the JSON body. One extra line is acceptable. Stripping it in the favorite envelope is required. A click on the alternate line and a click on the card must send the same `route_choice`. Rate limit is 8 plan POSTs per minute per IP (`app/api/plan/route.ts`). A pick is one more POST. Do not prefetch the second plan.

**Do not:** Draw every Valhalla alternate. Do not offer more than one alternative. Do not build POIs for the unchosen line.

---

## PR 7 — Map, reading pages, and night theme

**Goal:** The home map explains its dots, the border chips can be scrolled on purpose, the route is not hidden behind the plan, reading pages are not a map with a sidebar, and a dark system theme is dark on first visit.

**Depends on:** PR 6 for the fit-bounds change, because both touch `MapExperience` and `fitMapToRoute`. If PR 6 has not merged, skip the combined-line fit and only pad the primary line.

**Files:**

- Create: `components/map/MapLegend.tsx`
- Modify: `components/map/MapExperience.tsx`
- Modify: `lib/map/apply-waze-style.ts` (`fitMapToRoute` callers pass padding; the default padding stays)
- Modify: `lib/constants/map-layers.ts` (`traffic.visible` default `false`)
- Modify: `app/(app)/page.tsx` (chip scroller)
- Modify: `app/(app)/layout.tsx` (full-width reading routes, hide the map)
- Modify: `lib/stores/theme.store.ts`
- Modify: `app/layout.tsx` (the inline theme script)
- Modify: `components/theme/ThemeToggle.tsx` (label states the current theme and the click action)
- Modify: `components/map/MapControls.tsx` (text on the locate control: "Моето място"; leave zoom as + and − with `aria-label`)

**Legend:** A collapsed `<details>` at the bottom-left, above the chip row, summary "Легенда". Rows:

- blue line: chosen route
- teal line: the other route (only if an alternative is in the store)
- red / orange / amber / green dots: traffic severity, matching `TrafficLayer` colors (`critical`, `major`, `moderate`, `minor`)
- sentence: "Имената на градовете идват от картата и може да са на две азбуки."

Do not restyle OpenFreeMap symbol layers. A text-field override that hides `name:en` will break the next style update. The sentence is the fix.

**Clutter:** Default `traffic` to `false` in `MAP_LAYERS` and `DEFAULT_LAYER_VISIBILITY`. The layer panel can still turn it on. Community pins stay as they are.

**Chips:** The home border row keeps `overflow-x-auto`. Add `mask-image: linear-gradient(to right, black 85%, transparent)` when the row overflows (a `scrollWidth > clientWidth` check). Each chip's first line is the border name, the second is "изчакване сега" plus the badge from PR 4.

**Fit:** When `planOpen` is true on desktop, right padding is the plan sheet width (the sheet is `md:w-[380px]` on the route column; the plan sheet itself is fixed). Read the sheet node: `document.getElementById("plan-detail")` and use its `offsetWidth + 24` as `right` padding. Give the sheet root that id. On a 1440 px desktop the eastern end of a route to Sofia must fall left of the sheet. Mobile bottom padding stays large enough for the bottom sheet (`210`). Include the alternative geometry's coordinates in the bounds.

**Reading pages:** For `/tips`, `/emergency`, `/vignettes`, `/setup`, `/profile`, `/hotels`, the `<main>` is full width (`md:w-full`) and `MapHost` is not rendered (or `hidden` and unmounted). Do this with a set:

```ts
const READING = new Set(["/tips", "/emergency", "/vignettes", "/setup", "/profile", "/hotels"]);
```

`/borders`, `/fuel`, `/route`, `/weather`, `/community` keep the map column.

**Theme:** `useThemeStore` initial `scheme` stays `"light"` for the type. The inline script in `app/layout.tsx` already reads `localStorage` key `bg-road-theme`. Extend it: if that key is missing, set `s` from `matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"`. Do not overwrite a stored choice. `ThemeToggle` label: "Сега: светла. Превключи към тъмна" or the dark equivalent. `aria-pressed` stays.

**Acceptance:**

- First visit with `prefers-color-scheme: dark` and empty `localStorage` paints `document.documentElement.dataset.theme === "dark"`. A stored `"light"` stays light.
- Traffic dots are absent until the layer is enabled.
- The legend names the route colors and the four severities.
- `/tips` on a 1440 px width does not show the map.
- With the plan open, `fitMapToRoute` is called with a right padding greater than 380.

**Risks:** Unmounting `MapHost` on reading routes resets the map when the driver returns home. That is acceptable. Do not persist the map instance across those routes by hiding it with CSS if the review complaint was the map showing through. Unmount.

**Do not:** Add a new basemap vendor.

---

## PR 8 — Costs and papers the driver can check

**Goal:** Each vignette row can show a validity sentence that was copied from the official page, fuel stops do not contradict themselves, `/fuel` explains an empty list, and the pet / non-EU note does not pretend the driver is an EU citizen. There is no made-up trip total.

**Depends on:** PR 3 (`link_role`, shop URLs).

**Files:**

- Modify: `lib/constants/vignettes.ts` (optional `validity_bg`, `checked_on`)
- Modify: `components/vignettes/VignetteLinks.tsx` and `components/plan/PlanChecklist.tsx`
- Modify: `lib/planner/types.ts` (`fuel_averages` on the result)
- Modify: `lib/planner/run-plan.ts` (return the averages map already loaded)
- Modify: `lib/planner/assemble.ts` or the route handler, wherever the result object is finished
- Modify: `components/plan/StopTimeline.tsx` (`PriceLine`)
- Modify: `components/plan/PlanDetailSheet.tsx` (one averages block, one fuel estimate)
- Modify: `app/(app)/fuel/page.tsx`
- Modify: `lib/planner/checklist.ts` (pet and vehicle-registration sentences)
- Modify: `lib/planner/checklist.test.ts`
- Modify: `components/route/FuelEstimateCard.tsx` (wording only)

**Validity:** Add optional fields:

```ts
validity_bg?: string;
checked_on?: string; // YYYY-MM-DD
```

Fill them only by reading the official URL already on that row and pasting a short product list (for example "10 дни, 1 месец или 1 година"). Set `checked_on` to the day you read it. If the page does not say this in one glance, leave both fields unset. Do not type a euro, leva, franc, or forint amount. The row renders validity and the date when present: "Срокове (проверени на {date}): {validity}". Otherwise it renders nothing about price.

**Fuel lines:**

- `TripPlannerResult` gains

```ts
fuel_averages: Array<{
  country_code: string;
  eur_per_l: number;
  fuel: "diesel" | "petrol";
}>;
```

Populate it from the `averages` map `run-plan.ts` already builds. Empty when the bulletin has no row.

- A stop with `price === null` renders only "Няма цена за тази станция." It does not render a country average.
- The sheet renders one block "Средни цени по държавите на пътя" from `fuel_averages`, with "Това не е цената на станцията."
- `FuelEstimateCard` stays a consumption estimate. Change the heading's nearby caption to "Оценка на разхода, не оферта за гориво." Do not add it to vignette rows. Do not show a "total" that treats missing vignette prices as zero. Under the averages block, one sentence: "Обща сума няма: винетките се плащат в официалния магазин, горивото е оценка."

**`/fuel` empty:** When `fuelStations.length === 0`, the paragraph is "В момента няма списък със станции. Оценката на разхода по-долу работи без него." Add a button "Опитай отново" that calls `refetch` from `useFuelStations`. Do not set `POI_OVERPASS_FALLBACK`. Do not add a provider.

**Papers:**

- Pet item detail becomes: "ЕС паспорт на животното, микрочип и валидна ваксина срещу бяс. Важи за пътуване в ЕС и зависи от документите на животното, не от гражданството на водача. За Турция и други страни извън ЕС проверете условията преди тръгване." Add `href: "https://food.ec.europa.eu/animals/movement-pets_en"` on that item. Do not add per-country breed or muzzle rules.
- When `countries` includes a code outside `EU_CODES` (define the set you already treat as EU in this file: AT, HU, SI, CZ, SK, RO, BG, HR, GR, DE, FR, IT, ES, NL, BE, plus others the route can cross that are EU), add a document item: "Паспортът и визата зависят от гражданството. Германско пребиваване не се чете от този план. Винетката следва регистрацията на автомобила." Include this item when `TR`, `RS`, or `MK` is on the route.

**Tests:**

- Checklist with `withPet: true` has an `href` containing `movement-pets`.
- Checklist countries `["DE", "TR"]` include the citizenship sentence and do not include "ЕС граждани".
- A stop fixture with `price: null` and a country average on the result does not concatenate both strings in one component. Test the pure chooser:

```ts
export function stopPriceCopy(stop: { price: PlanPrice | null }): "station" | "unknown" | "none"
```

`null` price returns `"unknown"`. A price returns `"station"`. The average block is separate and is not a function of the stop.

**Acceptance:** `/vignettes` shows a validity line only on rows you filled from the official page. No row shows a currency amount added by guesswork. A fuel stop never shows an average and "няма цена" together. `/fuel` with an empty payload shows the new sentence and a retry button.

**Risks:** A validity sentence can go stale. `checked_on` is the mitigation. Do not refresh prices on a cron.

**Do not:** Scrape `web.bgtoll.bg`, ASFINAG, or eToll.

---

## PR 9 — Locale switch, Bulgarian still the default

**Goal:** A control on the home map, the top bar, the sidebar, and the login screen sets `bg` | `en` | `tr` | `ro`. The document language and the geocoder language follow it. Untranslated catalogs fall back to Bulgarian, never to a raw key.

**Depends on:** PR 2 and PR 7, which add the strings this switch must cover. Do the switch before translating.

**Files:**

- Create: `lib/i18n/locales/bg.ts` (move the object out of `lib/i18n/index.ts`)
- Create: `lib/i18n/locales/en.ts`, `tr.ts`, `ro.ts` (this PR exports `bg` re-aliased, so the app compiles; PR 10 replaces the aliases with real copy)
- Create: `lib/i18n/locale.ts`
- Create: `components/i18n/LocaleProvider.tsx`
- Create: `components/i18n/LocaleSwitcher.tsx`
- Modify: `lib/i18n/index.ts` (re-export `messages` as Bulgarian for any server module that still imports it)
- Modify: `app/layout.tsx` (`<html lang>`)
- Modify: `components/providers/Providers.tsx`
- Modify: `components/layout/TopBar.tsx`, `Sidebar.tsx`, `app/(app)/page.tsx`, `app/(auth)/login/page.tsx`
- Modify: `components/route/LocationSearchInput.tsx` (it already sends `document.documentElement.lang`)
- Test: `lib/i18n/locale.test.ts`

**Behavior:**

```ts
export const LOCALES = ["bg", "en", "tr", "ro"] as const;
export type Locale = (typeof LOCALES)[number];

export function parseLocale(value: unknown): Locale {
  return value === "en" || value === "tr" || value === "ro" ? value : "bg";
}
```

- Storage: `localStorage` key `bg-road-locale` and cookie `bg-road-locale` (`Path=/; Max-Age=31536000; SameSite=Lax`).
- `app/layout.tsx` reads the cookie with `cookies()` from `next/headers` and sets `<html lang={parseLocale(cookie)}>`. Default `bg`.
- Inline script, same pattern as the theme script, sets `document.documentElement.lang` from `localStorage` before paint.
- `LocaleProvider` holds the locale in React state, writes both stores, and provides `useLocale()` and `useMessages()`. `useMessages()` returns the catalog for that locale.
- This PR's `en`, `tr`, and `ro` files are `export { bg as en }` style re-exports from `bg.ts`, typed `satisfies Messages` once PR 10 splits them. A re-export is allowed only in this PR so the switch is testable before the translation. PR 10 must not ship re-exports.
- Replace `import { messages as m }` in client components you touch with `useMessages()`. Do not convert every file in this PR. Convert the chrome (top bar, sidebar, bottom nav, switcher, home search pill, login heading) and the planner form. Leave plan-sheet strings on `messages` until PR 10, but the provider must already be able to serve them.
- Server components and `lib/planner/*` keep importing Bulgarian `messages` until PR 10's `locale` argument. Do not thread locale through `runTripPlan` in this PR.
- Geocoder: `LocationSearchInput` already uses `document.documentElement.lang`. After the script and the provider set it, Photon receives `bg`, `en`, `tr`, or `ro`. No code change beyond ensuring `lang` is set before the fetch. Add an assertion in a comment in the test that `photonLanguage("tr")` is `"tr"` (read `photonLanguage` in `lib/api-clients/photon.ts`; it already slices to two letters).

**Switcher:** A `<select>` or four buttons, labels "Български", "English", "Türkçe", "Română", in that order. `aria-label` from `m.locale.switch` ("Език"). Place it in the sidebar, the top bar (left of "Влез"), the home overlay (next to the search pill), and the login page. 44 px minimum height.

**Tests:**

- `parseLocale("tr")` is `"tr"`. `parseLocale("de")`, `""`, and `null` are `"bg"`.
- `useMessages` is not tested in jsdom unless the repo already has a React test renderer. It does not. Skip component tests. The pure parser is enough.

**Acceptance:** Changing the control updates `<html lang>`, the cookie, and the next place search's `lang` parameter. Reloading keeps the choice. A new browser with no cookie is Bulgarian even if the OS is Turkish.

**Risks:** The root layout is a server component. Do not mark it `"use client"` to read `localStorage`. Cookie plus the inline script is the path.

**Do not:** Add `next-intl`. Do not translate catalogs in this PR.

---

## PR 10 — English, Turkish, and Romanian copy

**Goal:** The four catalogs are real translations, including vignette notes, emergency notes, border names shown in the UI, corridor labels, and the planner sentences.

**Depends on:** PR 9. Do this last.

**Files:**

- Modify: `lib/i18n/locales/en.ts`, `tr.ts`, `ro.ts` (replace the re-exports with full objects `satisfies Messages`)
- Modify: `lib/i18n/index.ts` (`catalog(locale): Messages`)
- Modify: every remaining client component that imports `messages` directly. The list at the time of writing: files under `components/plan/`, `components/route/`, `components/map/RouteBottomSheet.tsx`, `components/profile/`, `components/borders/` where they embed Bulgarian, `components/vignettes/VignetteLinks.tsx`, `components/setup/UserServicesPanel.tsx`, `app/(app)/*/page.tsx` page titles.
- Modify: `lib/constants/vignettes.ts`, `lib/constants/emergency-numbers.ts`, `lib/constants/travel-tips.ts`, `lib/constants/european-corridors.ts`, `lib/constants/border-crossings.ts` to hold copy for four locales without deleting `name_bg` / `notes_bg`.
- Modify: `lib/planner/checklist.ts`, `lib/planner/assemble.ts`, `lib/planner/why-route.ts` to take a `Locale` and pick the sentence.
- Modify: `app/api/plan/route.ts` to accept `locale` (optional, default `bg`) and pass it into `runTripPlan`.
- Test: `lib/i18n/catalog.test.ts`

**Copy shape for data that is not `Messages`:**

```ts
export type Localized = { bg: string; en: string; tr: string; ro: string };

export function pickText(locale: Locale, text: Localized): string {
  return text[locale] || text.bg;
}
```

Keep `name_bg` and `notes_bg` as the Bulgarian source so existing tests keep compiling. Add `name` and `notes` as `Localized`. `name_bg` must equal `name.bg`. One test asserts that for every vignette and every emergency row.

`POST /api/plan` adds `locale: z.enum(["bg", "en", "tr", "ro"]).optional()`. The client sends `useLocale()`. Omitted means `bg`. Stop reasons, checklist titles, and `why_this_route` strings are produced in that locale. Codes (`reason_code`, `country_code`, `link_role`) stay language-neutral.

**Translation rules for the implementer:**

- Translate from the Bulgarian catalog after PRs 1–8, not from an old memory of the UI.
- Proper names stay: Köln may be "Кьолн" in Bulgarian and "Köln" in English, Turkish, and Romanian. İstanbul keeps its Turkish spelling in `tr`. Border names: Bulgarian UI uses `name_bg`, other locales use `name_en` from `border-crossings.ts` (already present) unless a Turkish exonym is already in the file. Do not invent exonyms.
- Do not add legal claims that are not in the Bulgarian sentence.
- `en.ts`, `tr.ts`, and `ro.ts` must not contain leftover Bulgarian sentences. The test below enforces that for a sample of keys and should be extended with one key per section (`planning.calculate`, `sheet.oneRoute`, `checklist.officialInfo`).
- Romanian and Turkish use Latin. The Inter font already loads `latin-ext`.

**Test:**

```ts
import { en } from "@/lib/i18n/locales/en";
import { tr } from "@/lib/i18n/locales/tr";
import { ro } from "@/lib/i18n/locales/ro";

it("does not leave the Bulgarian calculate label in other catalogs", () => {
  expect(en.planning.calculate).not.toBe("Изчисли маршрут");
  expect(tr.planning.calculate).not.toBe("Изчисли маршрут");
  expect(ro.planning.calculate).not.toBe("Изчисли маршрут");
});
```

Write the same expect for `sheet.oneRoute` and `checklist.officialInfo`.

A type test is the `satisfies Messages` on each catalog. If a PR 1–8 key was added only to `bg`, this PR's typecheck fails until the other three files have it. Run `npx tsc --noEmit`.

**Acceptance:**

- With the switch on Türkçe, `/route`, `/vignettes`, `/borders`, `/emergency`, and a rebuilt plan show Turkish. The plan request body includes `"locale":"tr"`.
- Switching back to Български restores the original strings.
- `name_bg` is unchanged for every vignette country code listed in PR 3.
- `npx tsc --noEmit` and `npm test` pass.

**Risks:** Missing a hardcoded string in a page. After the catalogs exist, search for Cyrillic in `app/` and `components/` outside `lib/i18n/locales/bg.ts` and the `name_bg` fields. Each hit is either a proper name or a string still to move. Do not do this search until the catalogs are in place, or you will chase the Bulgarian source of truth.

**Do not:** Auto-translate user content (community pins, place names from OSM). OSM names stay as the geocoder returns them for the active `lang`.

---

## What each PR must run

From the repo root, for the PR you just finished:

```bash
npx vitest run <the test files named in that PR>
npm test
npm run lint
```

`npm run build` once, on PR 6 and PR 10, because those touch the plan response and the root layout. Skip the build on the copy-only PRs if `npm test` and `tsc` are green and no dependency changed.

Do not claim a browser pass you did not do. These PRs are specified so Vitest locks the rules. A human can click through `/route` on a preview after PR 1, PR 5, and PR 6.

## Order and why

| PR | User value | Effort | Why here |
|---|---|---|---|
| 1 Wrong-place submit | Stops a false route | Small | Nothing else matters if the route is the wrong cities |
| 2 Form and copy | Every session | Medium | Makes the planner usable before new features |
| 3 Vignette truth | Money at the border | Small | Independent content fix |
| 4 Wait and break truth | Trust in the numbers | Medium | Required before the two cards show waits |
| 5 Real overnight | Families | Medium | Rebuild in PR 6 must keep it |
| 6 Two routes | Owner priority | Medium-large | Uses the waits, tolls, and sleep from 3–5 |
| 7 Map and night | First impression | Medium | Fit-bounds should include the second line |
| 8 Costs and papers | The other money question | Medium | Needs the vignette shape from PR 3 |
| 9 Locale switch | Turkish drivers can find it | Medium | Empty catalogs first, so the switch is reviewable |
| 10 Translations | The app is actually readable | Large | Last, so strings from 1–8 are translated once |
