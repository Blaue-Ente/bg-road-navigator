import {
  CHILD_FACTOR,
  COFFEE_DEFAULT_EUR,
  COFFEE_EUR,
  DISTANCE_TOLL_EUR_PER_KM,
  EV_EUR_PER_KWH,
  FALLBACK_EUR_PER_L,
  MEAL_DEFAULT_EUR,
  MEAL_EUR,
  PRICES_CHECKED_ON,
  ROOM_DEFAULT_EUR,
  ROOM_EUR,
  TOLLED_SHARE,
  TOLLED_SHARE_BY_COUNTRY,
  VIGNETTES,
  type VignetteProduct,
} from "@/lib/costs/price-tables";

export type CostLineId =
  | "fuel"
  | "vignette"
  | "tolls"
  | "bridge"
  | "lodging"
  | "meals"
  | "coffee";

/** One line of the estimate. `detail` holds plain numbers and codes; the page words them. */
export interface CostLine {
  id: CostLineId;
  /** Null when the amount is not known (for example a Danube bridge fee). */
  eur: number | null;
  low: number | null;
  high: number | null;
  country?: string | null;
  detail: Record<string, number | string | null>;
}

export interface PlanCosts {
  currency: "EUR";
  checked_on: string;
  /** The way back is assumed to be the same road. */
  round_trip: boolean;
  /** Calendar days from leaving to coming back (or arriving, one way). */
  trip_days: number;
  travelers: { adults: number; children: number };
  lines: CostLine[];
  total_eur: number;
  total_low: number;
  total_high: number;
  per_person_eur: number;
  /** True when a line is missing an amount, so the total is a floor. */
  incomplete: boolean;
}

export interface CostInput {
  /** One way. */
  distanceKm: number;
  driveMin: number;
  /** Kilometres by country, one way. */
  countryKm: Record<string, number>;
  stops: Array<{ kinds: string[]; country: string | null }>;
  vehicle: { energy: "fuel" | "charge"; consumption_per_100: number };
  /** Pump price by country for the car's fuel, euro per litre. */
  averagePerL: Record<string, number>;
  adults: number;
  childrenAges: number[];
  departAt: Date;
  returnAt: Date | null;
  borderId: string | null;
}

const DAY_MS = 86_400_000;
const MIN_COUNTRY_KM = 3;
const DANUBE_BRIDGES = new Set(["danube-bridge-vidin", "danube-bridge-ruse"]);

const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function weighted(countryKm: Record<string, number>, price: (country: string) => number): number {
  const total = Object.values(countryKm).reduce((sum, km) => sum + km, 0);
  if (total <= 0) return price("");
  return Object.entries(countryKm).reduce((sum, [code, km]) => sum + price(code) * (km / total), 0);
}

/** The cheapest product that covers `days`, or the longest one when none does. */
export function cheapestCovering(products: VignetteProduct[], days: number): VignetteProduct {
  const sorted = [...products].sort((a, b) => a.eur - b.eur);
  return (
    sorted.find((product) => product.days >= days) ??
    [...products].sort((a, b) => b.days - a.days)[0]!
  );
}

/**
 * The cheapest way to be covered in one country: one product for the whole trip,
 * or (on a round trip) one short product for each pass.
 */
export function vignetteChoice(input: {
  products: VignetteProduct[];
  spanDays: number;
  passDays: number;
  roundTrip: boolean;
}): { days: number; count: number; each: number; total: number } {
  const whole = cheapestCovering(input.products, input.spanDays);
  const best = { days: whole.days, count: 1, each: whole.eur, total: whole.eur };
  if (input.roundTrip) {
    const pass = cheapestCovering(input.products, input.passDays);
    if (pass.eur * 2 < best.total) {
      return { days: pass.days, count: 2, each: pass.eur, total: round(pass.eur * 2, 2) };
    }
  }
  return best;
}

/** What the trip is likely to cost, line by line. A rough guide, never a quote. */
export function estimatePlanCosts(input: CostInput): PlanCosts {
  const roundTrip = input.returnAt != null;
  const ways = roundTrip ? 2 : 1;
  const children = input.childrenAges.length;
  const people = input.adults + children;
  const spanDays = roundTrip
    ? Math.max(1, Math.ceil((input.returnAt!.getTime() - input.departAt.getTime()) / DAY_MS) + 1)
    : Math.max(1, Math.ceil(input.driveMin / 60 / 14));
  const lines: CostLine[] = [];

  // Fuel or charging.
  const distance = input.distanceKm * ways;
  const unitsUsed = (distance * input.vehicle.consumption_per_100) / 100;
  if (input.vehicle.energy === "charge") {
    const eurTotal = unitsUsed * EV_EUR_PER_KWH;
    lines.push({
      id: "fuel",
      eur: round(eurTotal),
      low: round(eurTotal * 0.8),
      high: round(eurTotal * 1.3),
      detail: { kwh: round(unitsUsed), eur_per_unit: EV_EUR_PER_KWH, charge: 1 },
    });
  } else {
    const perL = weighted(input.countryKm, (code) => input.averagePerL[code] ?? FALLBACK_EUR_PER_L);
    const eurTotal = unitsUsed * perL;
    lines.push({
      id: "fuel",
      eur: round(eurTotal),
      low: round(eurTotal * 0.92),
      high: round(eurTotal * 1.1),
      detail: { liters: round(unitsUsed), eur_per_unit: round(perL, 3), charge: 0 },
    });
  }

  // Vignettes, by country, for the length of the trip.
  const overnightCountries = new Set(
    input.stops
      .filter((stop) => stop.kinds.includes("overnight") && stop.country)
      .map((stop) => stop.country!)
  );
  for (const [code, km] of Object.entries(input.countryKm)) {
    const products = VIGNETTES[code];
    if (!products || km < MIN_COUNTRY_KM) continue;
    const passDays = overnightCountries.has(code) ? 2 : 1;
    const choice = vignetteChoice({ products, spanDays: roundTrip ? spanDays : passDays, passDays, roundTrip });
    lines.push({
      id: "vignette",
      country: code,
      eur: round(choice.total, 2),
      low: round(choice.total, 2),
      high: round(choice.total * 1.05, 2),
      detail: { days: choice.days, count: choice.count, each_eur: round(choice.each, 2) },
    });
  }

  // Pay-per-distance motorways.
  for (const [code, km] of Object.entries(input.countryKm)) {
    const rate = DISTANCE_TOLL_EUR_PER_KM[code];
    if (rate == null || km < MIN_COUNTRY_KM) continue;
    const tolledKm = km * (TOLLED_SHARE_BY_COUNTRY[code] ?? TOLLED_SHARE) * ways;
    const eurTotal = tolledKm * rate;
    if (eurTotal < 0.5) continue;
    lines.push({
      id: "tolls",
      country: code,
      eur: round(eurTotal, 1),
      low: round(eurTotal * 0.8, 1),
      high: round(eurTotal * 1.25, 1),
      detail: { km: round(tolledKm), eur_per_km: rate },
    });
  }

  // A Danube bridge: the fee is not confirmed, so it is named but not counted.
  if (input.borderId && DANUBE_BRIDGES.has(input.borderId)) {
    lines.push({
      id: "bridge",
      eur: null,
      low: null,
      high: null,
      detail: { crossings: ways, border: input.borderId },
    });
  }

  // Nights on the road.
  const nightsOneWay = input.stops.filter((stop) => stop.kinds.includes("overnight")).length;
  if (nightsOneWay > 0) {
    const rooms = Math.max(1, Math.ceil(input.adults / 2));
    const stopRoom = input.stops
      .filter((stop) => stop.kinds.includes("overnight"))
      .map((stop) => ROOM_EUR[stop.country ?? ""] ?? ROOM_DEFAULT_EUR);
    const avgRoom = stopRoom.reduce((sum, price) => sum + price, 0) / stopRoom.length;
    const nights = nightsOneWay * ways;
    const eurTotal = nights * rooms * avgRoom;
    lines.push({
      id: "lodging",
      eur: round(eurTotal),
      low: round(eurTotal * 0.75),
      high: round(eurTotal * 1.3),
      detail: { nights, rooms, eur_per_room: round(avgRoom) },
    });
  }

  // Meals: one every five waking hours on the road, children eating less.
  const awakeHours = input.driveMin / 60 + 1;
  const mealsEach = Math.max(1, Math.round(awakeHours / 5)) * ways;
  const mealPrice = weighted(input.countryKm, (code) => MEAL_EUR[code] ?? MEAL_DEFAULT_EUR);
  const eatingPeople = input.adults + children * CHILD_FACTOR;
  const mealsTotal = mealsEach * mealPrice * eatingPeople;
  lines.push({
    id: "meals",
    eur: round(mealsTotal),
    low: round(mealsTotal * 0.75),
    high: round(mealsTotal * 1.3),
    detail: { meals_each: mealsEach, eur_per_meal: round(mealPrice, 1), people: people },
  });

  // Coffee and a snack at the breaks.
  const breaks = input.stops.filter(
    (stop) => !stop.kinds.includes("overnight") && !stop.kinds.includes("sight")
  ).length;
  if (breaks > 0) {
    const coffee = weighted(input.countryKm, (code) => COFFEE_EUR[code] ?? COFFEE_DEFAULT_EUR);
    const stopsTotal = breaks * ways;
    const eurTotal = stopsTotal * coffee * (input.adults + children * CHILD_FACTOR);
    lines.push({
      id: "coffee",
      eur: round(eurTotal),
      low: round(eurTotal * 0.7),
      high: round(eurTotal * 1.3),
      detail: { stops: stopsTotal, eur_per_person: round(coffee, 1) },
    });
  }

  const known = lines.filter((line) => line.eur != null);
  const total = known.reduce((sum, line) => sum + line.eur!, 0);
  const low = known.reduce((sum, line) => sum + (line.low ?? line.eur!), 0);
  const high = known.reduce((sum, line) => sum + (line.high ?? line.eur!), 0);
  return {
    currency: "EUR",
    checked_on: PRICES_CHECKED_ON,
    round_trip: roundTrip,
    trip_days: spanDays,
    travelers: { adults: input.adults, children },
    lines,
    total_eur: round(total),
    total_low: round(low),
    total_high: round(high),
    per_person_eur: round(total / Math.max(1, people)),
    incomplete: lines.some((line) => line.eur == null),
  };
}
