import type { TripGuideInput } from "@/lib/ai/trip-guide";
import type { PlanSight } from "@/lib/sights/types";
import type { Locale } from "@/lib/i18n/locale";
import { drivingDayHours, effectiveBreakEveryMin, healthDayLimitH } from "@/lib/planner/preferences";
import { fuelVerdict } from "@/lib/planner/fuel-verdict";
import type { PlanStop, TripPlannerResult } from "@/lib/planner/types";

/** "19 Dec, 13:00" in the device's own clock, which is what the driver sees on the plan. */
function clock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 40);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function stopFacts(stop: PlanStop): string[] {
  const facts: string[] = [];
  if (stop.reason) facts.push(stop.reason.slice(0, 160));
  if (stop.brand) facts.push(`brand ${stop.brand}`.slice(0, 160));
  if (stop.price_label_bg) facts.push(stop.price_label_bg.slice(0, 160));
  // No price for the station itself: the country average is the price to expect.
  else if (stop.average_label_bg) facts.push(`no station price; ${stop.average_label_bg}`.slice(0, 160));
  if (stop.price_delta_label_bg) facts.push(stop.price_delta_label_bg.slice(0, 160));
  for (const flag of stop.flags.slice(0, 3)) {
    facts.push(`drivers flagged: ${flag.flag}`);
  }
  if (stop.dwell_min) facts.push(`planned stop about ${stop.dwell_min} min`);
  if (stop.sleep_min) facts.push(`sleep about ${Math.round(stop.sleep_min / 60)} h`);
  return facts.slice(0, 8);
}

export interface AlongPoint {
  km: number;
  lat: number;
  lng: number;
  town?: string | null;
}

/** Points spread along the route, for the server to turn into town names. */
export function alongPoints(
  line: Array<[number, number]>,
  distanceKm: number,
  count = 6
): AlongPoint[] {
  if (line.length < 2 || distanceKm < 150) return [];
  const out: AlongPoint[] = [];
  for (let i = 1; i <= count; i += 1) {
    const at = line[Math.min(line.length - 1, Math.round((i / (count + 1)) * (line.length - 1)))]!;
    out.push({
      km: Math.round((i / (count + 1)) * distanceKm),
      lng: Math.round(at[0] * 1e4) / 1e4,
      lat: Math.round(at[1] * 1e4) / 1e4,
    });
  }
  return out;
}

/** True when the first leg starts between 18:00 and 05:59 on the device clock. */
export function leavesAtNight(departIso: string): boolean {
  const hour = new Date(departIso).getHours();
  return Number.isFinite(hour) && (hour >= 18 || hour < 6);
}

/** The plan's facts for the model, in a small, bounded shape. */
export function guideInputFromPlan(
  plan: TripPlannerResult,
  locale: Locale,
  countries: string[] = [],
  via: string[] = [],
  chosenSights: PlanSight[] = [],
  /** Ids of fast-food places the driver added to the route. */
  chosenFoodIds: string[] = []
): TripGuideInput {
  const prefs = plan.preferences;
  const real = plan.stops
    .filter((stop) => !stop.optional && !stop.kinds.includes("sight"))
    .slice(0, 24);

  // Days are cut at the overnight stops.
  let day = 1;
  const dayOf = new Map<string, number>();
  const days: TripGuideInput["days"] = [];
  let fromKm = 0;
  for (const stop of real) {
    dayOf.set(stop.id, day);
    if (stop.kinds.includes("overnight")) {
      days.push({
        day,
        from_km: fromKm,
        to_km: stop.distance_from_start_km,
        ends_local: clock(stop.eta),
        ends_at_stop: stop.id.slice(0, 60),
      });
      fromKm = stop.distance_from_start_km;
      day += 1;
    }
  }
  const arrival =
    plan.route.arrive_at ??
    new Date(Date.parse(plan.depart_at) + plan.route.total_min * 60_000).toISOString();
  days.push({
    day,
    from_km: fromKm,
    to_km: plan.route.distance_km,
    ends_local: clock(arrival),
    ends_at_stop: null,
  });

  const chosen = plan.border.chosen;
  const hazards = (plan.road_hazards ?? [])
    .slice(0, 3)
    .map((hazard) => `${hazard.label_bg}: ${hazard.text_bg}`.slice(0, 220));

  return {
    locale,
    origin: plan.route.origin.label.slice(0, 120),
    destination: plan.route.destination.label.slice(0, 120),
    distance_km: plan.route.distance_km,
    duration_min: plan.route.duration_min,
    total_min: plan.route.total_min,
    depart_local: clock(plan.depart_at),
    arrive_local: clock(arrival),
    pace: prefs.pace,
    car_comfort: prefs.car_comfort,
    leaves_at_night: leavesAtNight(plan.depart_at),
    max_day_driving_h: drivingDayHours(prefs),
    scenic_route: plan.route.scenic ?? null,
    driver_plan: plan.driver_plan
      ? {
          stint_min: plan.driver_plan.stint_min,
          per_driver_min: plan.driver_plan.per_driver_min.slice(0, 4),
          turns: plan.driver_plan.turns.slice(0, 20).map((turn) => ({
            driver: turn.driver,
            from: turn.from_label.slice(0, 80),
            until: turn.until_label.slice(0, 80),
            from_local: clock(turn.from_eta),
            until_local: clock(turn.until_eta),
            driving_min: turn.driving_min,
          })),
        }
      : null,
    day_limit_h: healthDayLimitH(prefs),
    bad_roads: plan.community.notes
      .filter((note) => note.category === "bad_road")
      .slice(0, 8)
      .map((note) => ({
        title: note.title.slice(0, 120),
        off_route_km: note.distance_km,
        ...(note.from_km != null && note.to_km != null ? { from_km: note.from_km, to_km: note.to_km } : {}),
      })),
    via: via.slice(0, 3).map((label) => label.slice(0, 120)),
    chosen_sights: chosenSights.map((sight) => ({
      name: sight.name.slice(0, 120),
      town: sight.town.slice(0, 120),
      kind: sight.kind,
      along_km: sight.along_km,
      extra_min: sight.extra_min,
      why: sight.why.slice(0, 400),
      history: sight.history.slice(0, 700),
    })),
    break_every_min: effectiveBreakEveryMin(prefs),
    travelers: {
      adults: Math.min(8, Math.max(1, prefs.adults ?? 1, prefs.drivers)),
      children_ages: prefs.with_children ? prefs.children_ages.slice(0, 8) : [],
      pet: prefs.with_pet,
      drivers: prefs.drivers,
    },
    vehicle: plan.vehicle.vehicle_type,
    countries: countries.slice(0, 12),
    border: chosen
      ? {
          name: chosen.name_en.slice(0, 120),
          wait_min: Math.max(0, Math.round(chosen.wait.minutes)),
        }
      : null,
    weather: plan.weather.segments.slice(0, 10).map((segment) =>
      [
        clock(segment.eta),
        segment.place ?? `km ${segment.distance_from_start_km}`,
        segment.temperature_c != null ? `${Math.round(segment.temperature_c)}C` : "",
        segment.summary_bg,
        segment.wind_kmh != null ? `wind ${Math.round(segment.wind_kmh)} km/h` : "",
        segment.precipitation_mm ? `rain ${segment.precipitation_mm} mm` : "",
      ]
        .filter(Boolean)
        .join(", ")
        .slice(0, 180)
    ),
    vignettes: [...plan.checklist.vignettes, ...plan.checklist.toll_sections]
      .slice(0, 10)
      .map((item) => item.title.slice(0, 120)),
    warnings: [
      ...plan.warnings,
      ...plan.weather.warnings.map((warning) => `${warning.title}: ${warning.detail}`),
      ...hazards,
    ]
      .slice(0, 8)
      .map((line) => line.slice(0, 220)),
    days,
    costs: plan.costs
      ? {
          round_trip: plan.costs.round_trip,
          trip_days: plan.costs.trip_days,
          total_eur: plan.costs.total_eur,
          total_low: plan.costs.total_low,
          total_high: plan.costs.total_high,
          per_person_eur: plan.costs.per_person_eur,
          incomplete: plan.costs.incomplete,
          prices_checked_on: plan.costs.checked_on,
          lines: plan.costs.lines.slice(0, 20).map((line) => ({
            kind: line.id,
            country: line.country ?? null,
            eur: line.eur,
            detail: line.detail,
          })),
        }
      : null,
    stops: real.map((stop) => {
      const overnight = stop.kinds.includes("overnight");
      const fuel = stop.kinds.includes("fuel");
      const verdict = fuel ? fuelVerdict(stop) : null;
      return {
        id: stop.id.slice(0, 60),
        kind: stop.kinds.join("+").slice(0, 60),
        day: dayOf.get(stop.id),
        title: stop.title.slice(0, 120),
        place: (stop.place_name ?? null)?.slice(0, 120) ?? null,
        km: stop.distance_from_start_km,
        local_time: clock(stop.eta),
        detour_km: stop.detour_km,
        facts: stopFacts(stop),
        ...(overnight
          ? {
              lat: stop.coords.lat,
              lng: stop.coords.lng,
              hotel: stop.hotel?.name.slice(0, 120) ?? null,
              hotel_stars: stop.hotel?.stars ?? null,
            }
          : {}),
        ...(verdict ? { verdict: `${verdict.verdict}: ${verdict.reasons.join(", ")}`.slice(0, 120) } : {}),
      };
    }),
    food_spots: (plan.food_spots ?? []).slice(0, 12).map((spot) => ({
      chain: spot.chain.slice(0, 40),
      chosen: chosenFoodIds.includes(spot.id),
      km: spot.distance_from_start_km,
      local_time: clock(spot.eta),
      detour_km: Math.min(50, spot.detour_km),
    })),
  };
}
