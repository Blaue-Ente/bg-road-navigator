/**
 * Units of a currency per one euro, for the countries whose fuel prices come in
 * their own money. The dinar and the denar are managed close to these levels;
 * the rest come from the ECB rates the app already fetches.
 */
export const FIXED_UNITS_PER_EUR: Record<string, number> = {
  EUR: 1,
  BGN: 1.95583,
  RSD: 117.2,
  MKD: 61.5,
};

/** A price in euro, or null when the currency has no known rate (never a guess). */
export function toEuro(
  price: number,
  currency: string,
  rates: Record<string, number> = {}
): number | null {
  const code = currency.trim().toUpperCase() || "EUR";
  const perEuro = FIXED_UNITS_PER_EUR[code] ?? rates[code];
  if (!perEuro || !Number.isFinite(perEuro) || perEuro <= 0) return null;
  const value = price / perEuro;
  return Number.isFinite(value) ? Math.round(value * 1000) / 1000 : null;
}
