import { countryName } from "@/lib/geo/country-name";
import type { Locale } from "@/lib/i18n/locale";
import { priceBand, type PriceBand } from "@/lib/fuel-prices/bands";
import type { FuelCountryAverage, PlanPriceSource } from "@/lib/planner/types";

export const OIL_BULLETIN_SOURCE = "ec-oil-bulletin" as const;
export const OIL_BULLETIN_SOURCE_LABEL =
  "Европейска комисия, Weekly Oil Bulletin";

const FUEL_BG: Record<"diesel" | "petrol" | "lpg", string> = {
  diesel: "дизел",
  petrol: "бензин",
  lpg: "газ",
};

export interface KnownAverage {
  price: number;
  week: string;
}

export function formatDecimal(value: number, digits: number): string {
  return value.toFixed(digits).replace(".", ",");
}

export function formatBulletinWeek(week: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(week.trim());
  if (!match) return week;
  return `${Number(match[3])}.${Number(match[2])}.${match[1]}`;
}

export function countryAverageLabel(input: {
  countryName: string;
  fuel: "diesel" | "petrol" | "lpg";
  price: number | null;
}): string {
  if (input.price == null) return `${input.countryName}: няма средна цена`;
  return `${input.countryName}: ${FUEL_BG[input.fuel]} ср. ${formatDecimal(input.price, 2)} €/л`;
}

export function priceDeltaLabel(input: {
  stationPerL: number;
  averagePerL: number;
  liters: number;
}): string {
  const delta = round3(input.stationPerL - input.averagePerL);
  const signed = signedPerLitre(delta);
  if (!(input.liters > 0)) return signed;
  const euros = formatApproxEuro(Math.abs(round2(delta * input.liters)));
  const liters = formatLiters(input.liters);
  if (delta < -0.0005) {
    return `${signed}, спестяваш ~${euros} € за ${liters} л`;
  }
  if (delta > 0.0005) {
    return `${signed}, плащаш ~${euros} € повече за ${liters} л`;
  }
  return `${signed} спрямо средното за ${liters} л`;
}

export function stationSourceLabel(input: {
  source: PlanPriceSource;
  observedAt: string | null;
  now: Date;
}): string {
  if (input.source === "e-control") return "E-Control";
  if (input.source === "tankerkoenig") return "Tankerkönig";
  const hours = communityHours(input.observedAt, input.now);
  if (hours == null) return "от потребител";
  return `от потребител, преди ${hours} ч`;
}

export function fuelAveragesForCountries(input: {
  countries: string[];
  fuel: "diesel" | "petrol" | "lpg" | "electric";
  known: ReadonlyMap<string, KnownAverage>;
  locale?: Locale;
}): FuelCountryAverage[] {
  const locale = input.locale ?? "bg";
  if (input.fuel === "electric") return [];
  const seen = new Set<string>();
  const rows: FuelCountryAverage[] = [];
  for (const code of input.countries) {
    const country = code.trim().toUpperCase();
    if (!country || seen.has(country)) continue;
    seen.add(country);
    const known = input.known.get(country) ?? null;
    const price = known && Number.isFinite(known.price) ? known.price : null;
    rows.push({
      country_code: country,
      country_name_bg: countryName(country, locale),
      fuel: input.fuel,
      price_eur_per_l: price,
      week: price == null ? null : (known?.week ?? null),
      week_label_bg:
        price == null || !known?.week ? null : formatBulletinWeek(known.week),
      source: price == null ? null : OIL_BULLETIN_SOURCE,
      source_label_bg: OIL_BULLETIN_SOURCE_LABEL,
      label_bg: countryAverageLabel({
        countryName: countryName(country, locale),
        fuel: input.fuel,
        price,
      }),
    });
  }
  return rows;
}

export interface FuelStopCopy {
  price_band: PriceBand;
  average_label_bg: string | null;
  price_label_bg: string | null;
  price_delta_label_bg: string | null;
  price_source_label_bg: string | null;
}

export function presentFuelStop(input: {
  countryCode: string | null;
  fuel: "diesel" | "petrol" | "lpg";
  average: KnownAverage | null;
  stationPerL: number | null;
  source: PlanPriceSource | null;
  observedAt: string | null;
  liters: number;
  now: Date;
  locale?: Locale;
}): FuelStopCopy {
  const band = priceBand(input.stationPerL, input.average?.price ?? null);
  const locale = input.locale ?? "bg";
  const countryLabel = input.countryCode
    ? countryName(input.countryCode, locale)
    : null;
  const averageLabel =
    countryLabel == null || input.stationPerL == null
      ? null
      : countryAverageLabel({
          countryName: countryLabel,
          fuel: input.fuel,
          price: input.average?.price ?? null,
        });
  const coloured = band !== "grey";
  return {
    price_band: band,
    average_label_bg: averageLabel,
    price_label_bg:
      input.stationPerL == null
        ? null
        : `${formatDecimal(input.stationPerL, 3)} €/л`,
    price_delta_label_bg:
      coloured && input.stationPerL != null && input.average
        ? priceDeltaLabel({
            stationPerL: input.stationPerL,
            averagePerL: input.average.price,
            liters: input.liters,
          })
        : null,
    price_source_label_bg:
      coloured && input.source
        ? stationSourceLabel({
            source: input.source,
            observedAt: input.observedAt,
            now: input.now,
          })
        : null,
  };
}

function signedPerLitre(delta: number): string {
  const body = `${formatDecimal(Math.abs(delta), 2)} €/л`;
  if (delta < -0.0005) return `−${body}`;
  if (delta > 0.0005) return `+${body}`;
  return body;
}

function formatApproxEuro(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05)
    return String(Math.round(rounded));
  return formatDecimal(rounded, 1);
}

function formatLiters(liters: number): string {
  const rounded = Math.round(liters * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05)
    return String(Math.round(rounded));
  return formatDecimal(rounded, 1);
}

function communityHours(observedAt: string | null, now: Date): number | null {
  if (!observedAt) return null;
  const stamp = new Date(observedAt).getTime();
  if (!Number.isFinite(stamp)) return null;
  return Math.max(0, Math.round((now.getTime() - stamp) / 3_600_000));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
