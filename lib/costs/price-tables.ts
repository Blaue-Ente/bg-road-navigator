/**
 * Indicative prices for the trip cost estimate. They are a snapshot, not a live
 * feed: the day they were read is below, and the estimate always says so and
 * points to the official shop. Euro prices for non-euro countries use the
 * rates stated next to them.
 */
export const PRICES_CHECKED_ON = "2026-11-18";

export interface VignetteProduct {
  /** How many calendar days it covers. */
  days: number;
  eur: number;
}

/** Rates used to turn national prices into euro. */
const CZK_PER_EUR = 24.3;
const HUF_PER_EUR = 395;
const RON_PER_EUR = 5.26;

const eur = (value: number) => Math.round(value * 100) / 100;

/**
 * Passenger-car vignettes and tolls by time. Bulgaria's tariff is the one in
 * force since 1 August 2026; the rest are the 2026 national tariffs.
 */
export const VIGNETTES: Record<string, VignetteProduct[]> = {
  BG: [
    { days: 1, eur: 5.3 },
    { days: 7, eur: 10 },
    { days: 30, eur: 19.9 },
    { days: 90, eur: 35.9 },
    { days: 365, eur: 64.5 },
  ],
  AT: [
    { days: 1, eur: 9.6 },
    { days: 10, eur: 12.8 },
    { days: 60, eur: 32 },
    { days: 365, eur: 106.8 },
  ],
  CZ: [
    { days: 1, eur: eur(230 / CZK_PER_EUR) },
    { days: 10, eur: eur(300 / CZK_PER_EUR) },
    { days: 30, eur: eur(480 / CZK_PER_EUR) },
    { days: 365, eur: eur(2570 / CZK_PER_EUR) },
  ],
  SK: [
    { days: 1, eur: 8.1 },
    { days: 10, eur: 10.8 },
    { days: 30, eur: 17.1 },
    { days: 365, eur: 90 },
  ],
  HU: [
    { days: 1, eur: eur(5550 / HUF_PER_EUR) },
    { days: 10, eur: eur(6900 / HUF_PER_EUR) },
    { days: 30, eur: eur(11170 / HUF_PER_EUR) },
    { days: 365, eur: eur(61760 / HUF_PER_EUR) },
  ],
  // Euro 6 car; the rate depends on the emission class.
  RO: [
    { days: 1, eur: eur(22 / RON_PER_EUR) },
    { days: 10, eur: eur(30 / RON_PER_EUR) },
    { days: 30, eur: eur(48 / RON_PER_EUR) },
    { days: 60, eur: eur(76 / RON_PER_EUR) },
    { days: 365, eur: eur(254 / RON_PER_EUR) },
  ],
  SI: [
    { days: 7, eur: 16 },
    { days: 30, eur: 32 },
    { days: 365, eur: 117.5 },
  ],
  // Annual only.
  CH: [{ days: 365, eur: 43 }],
};

/** Countries with pay-per-distance motorways, euro per km of motorway. Rough averages. */
export const DISTANCE_TOLL_EUR_PER_KM: Record<string, number> = {
  RS: 0.045,
  HR: 0.075,
  MK: 0.03,
  GR: 0.06,
  IT: 0.1,
  FR: 0.11,
  ES: 0.09,
  PT: 0.09,
  PL: 0.06,
  TR: 0.04,
};

/** Share of the kilometres in such a country that are on the tolled motorway. */
export const TOLLED_SHARE = 0.8;

/** A casual meal per person, euro. */
export const MEAL_EUR: Record<string, number> = {
  DE: 16, AT: 17, CH: 25, NL: 17, BE: 17, DK: 22, FR: 17, IT: 15, ES: 13, PT: 12,
  PL: 9, CZ: 10, SK: 10, HU: 9, SI: 12, HR: 13, RS: 8, RO: 8, BG: 8, MK: 7, GR: 12, TR: 8,
};
export const MEAL_DEFAULT_EUR = 12;

/** A coffee and a snack at a stop, per adult, euro. */
export const COFFEE_EUR: Record<string, number> = {
  DE: 3.2, AT: 3.8, CH: 5, CZ: 2.5, SK: 2.5, HU: 2.4, RO: 2.2, BG: 2.2, RS: 1.8, GR: 3, TR: 1.8,
};
export const COFFEE_DEFAULT_EUR = 3;

/** A double room for a night in a 3-star hotel, euro. */
export const ROOM_EUR: Record<string, number> = {
  DE: 100, AT: 110, CH: 160, CZ: 70, SK: 70, HU: 70, SI: 95, HR: 90, RS: 55, RO: 55, BG: 55,
  MK: 45, GR: 75, TR: 50, PL: 65, IT: 105,
};
export const ROOM_DEFAULT_EUR = 85;

/** An electric car on public fast chargers, euro per kWh. */
export const EV_EUR_PER_KWH = 0.5;
/** A fallback pump price when a country has no average, euro per litre. */
export const FALLBACK_EUR_PER_L = 1.9;

/** A child eats and drinks less than an adult. */
export const CHILD_FACTOR = 0.6;
