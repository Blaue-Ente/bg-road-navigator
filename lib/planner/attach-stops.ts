import type { StopAttachment } from "@/lib/planner/assemble";
import type { TimedStop } from "@/lib/planner/breaks";
import { foodChainSpots, type FoodSpotDraft } from "@/lib/planner/food-spots";
import { buildFuelAdvice, fillLiters } from "@/lib/fuel-prices/advice";
import {
  isNamedPlace,
  pickPlace,
  pickSights,
  type AnnotatedPlace,
} from "@/lib/planner/pick-place";
import type { TripPreferences } from "@/lib/planner/preferences";
import { starsFromTags } from "@/lib/planner/stars";
import type {
  FuelAdvice,
  PlaceFlagSummary,
  PlanPrice,
} from "@/lib/planner/types";
import type { ResolvedVehicle } from "@/lib/planner/vehicle";
import { catalog, type Locale } from "@/lib/i18n/locale";
import { formatTemplate } from "@/lib/i18n/format-template";

const FUEL_LOOKBACK_KM = 40;

export function attachStops(input: {
  merged: TimedStop[];
  places: AnnotatedPlace[];
  preferences: TripPreferences;
  vehicle: ResolvedVehicle;
  driveMin: number;
  distanceKm: number;
  countryAt: (lat: number, lng: number) => string | null;
  averagePerLitre: (country: string) => number | null;
  locale?: Locale;
}): {
  attachments: StopAttachment[];
  sights: StopAttachment[];
  foodSpots: FoodSpotDraft[];
} {
  const stopCopy = catalog(input.locale ?? "bg").planner.stops;
  const liters = fillLiters(input.vehicle);
  const fuel =
    input.vehicle.fuel_type === "electric" ? null : input.vehicle.fuel_type;
  const priced = input.places.map((place) =>
    withSavings(place, input, fuel, liters)
  );

  const attachments = input.merged.map((stop) => {
    const energy = stop.kinds.includes("charge")
      ? "charging"
      : stop.kinds.includes("fuel")
        ? "fuel"
        : null;
    const hotel = stop.kinds.includes("overnight");
    let place: AnnotatedPlace | null = null;
    let lodgingNote: string | null = null;

    if (energy) {
      place = pickPlace(priced, input.preferences, {
        kinds: [energy],
        windowStartKm: Math.max(0, stop.distanceKm - FUEL_LOOKBACK_KM),
        windowEndKm: stop.distanceKm,
      });
    }

    if (hotel) {
      const stay = pickPlace(priced, input.preferences, {
        kinds: ["hotel"],
        windowStartKm: Math.max(0, stop.distanceKm - 15),
        windowEndKm: stop.distanceKm + 8,
        looseDetourKm: 12,
      });
      if (!place && stay) place = stay;
      else if (stay && isNamedPlace(stay)) {
        lodgingNote = formatTemplate(stopCopy.lodgingNearby, {
          name: stay.name ?? "",
        });
      } else if (!stay) {
        lodgingNote = stopCopy.lodgingNoMapHotel;
      }
    }

    if (!place && stop.kinds.includes("rest")) {
      place = pickPlace(priced, input.preferences, {
        kinds: input.preferences.with_children
          ? ["rest_area", "restaurant", "playground", "toilets"]
          : ["rest_area", "restaurant", "toilets"],
        windowStartKm: Math.max(0, stop.distanceKm - 12),
        windowEndKm: stop.distanceKm + 8,
        looseDetourKm: Math.max(6, input.preferences.max_detour_min / 2),
      });
    }

    return toAttachment(stop, place, lodgingNote, input, fuel, liters);
  });

  const sights = pickSights(
    priced,
    input.preferences,
    input.merged.map((stop) => stop.distanceKm),
    input.driveMin,
    input.distanceKm
  ).map((place) => {
    const etaMin =
      input.distanceKm <= 0
        ? 0
        : (place.alongKm / input.distanceKm) * input.driveMin;
    return toAttachment(
      { distanceKm: place.alongKm, etaMin },
      place,
      null,
      input,
      fuel,
      liters
    );
  });

  const foodSpots = foodChainSpots(priced, {
    distanceKm: input.distanceKm,
    driveMin: input.driveMin,
  });

  return { attachments, sights, foodSpots };
}

function withSavings(
  place: AnnotatedPlace,
  input: {
    countryAt: (lat: number, lng: number) => string | null;
    averagePerLitre: (country: string) => number | null;
  },
  fuel: "diesel" | "petrol" | "lpg" | null,
  liters: number
): AnnotatedPlace {
  if (place.kind !== "fuel" || !fuel) return place;
  const country = input.countryAt(place.lat, place.lng);
  const average = country ? input.averagePerLitre(country) : null;
  if (
    place.priceAmount == null ||
    average == null ||
    place.priceBasis == null
  ) {
    return { ...place, nationalAvgPerL: average };
  }
  const advice = buildFuelAdvice({
    stationPerL: place.priceAmount,
    nationalAvgPerL: average,
    liters,
    basis: place.priceBasis,
  });
  return {
    ...place,
    nationalAvgPerL: average,
    savingsEur: advice?.est_savings_eur ?? null,
  };
}

function toAttachment(
  stop: { distanceKm: number; etaMin: number },
  place: AnnotatedPlace | null,
  lodgingNote: string | null,
  input: {
    countryAt: (lat: number, lng: number) => string | null;
    averagePerLitre: (country: string) => number | null;
  },
  fuel: "diesel" | "petrol" | "lpg" | null,
  liters: number
): StopAttachment {
  const advice = adviceFor(place, input, fuel, liters);
  const flags: PlaceFlagSummary[] = Object.entries(place?.flagWeights ?? {})
    .map(([flag, weight]) => ({ flag, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);
  return {
    etaMin: stop.etaMin,
    distanceKm: stop.distanceKm,
    name: place && isNamedPlace(place) ? place.name : (place?.name ?? null),
    brand: place?.brand ?? null,
    coords: place ? { lng: place.lng, lat: place.lat } : null,
    detourKm: place ? Math.round(place.detourKm * 10) / 10 : null,
    motorwayService: place?.motorwayService ?? false,
    source: place
      ? place.source === "openchargemap"
        ? "openchargemap"
        : "osm"
      : "calculated",
    placeId: place?.id ?? null,
    price: priceFor(place),
    advice,
    flags,
    lodgingNote,
    stars: starsFromTags(place?.tags),
    optional: place?.kind === "attraction" || place?.kind === "viewpoint",
  };
}

function adviceFor(
  place: AnnotatedPlace | null,
  input: {
    countryAt: (lat: number, lng: number) => string | null;
    averagePerLitre: (country: string) => number | null;
  },
  fuel: "diesel" | "petrol" | "lpg" | null,
  liters: number
): FuelAdvice | null {
  if (!place || place.kind !== "fuel" || place.priceAmount == null || !fuel) {
    return null;
  }
  const country = input.countryAt(place.lat, place.lng);
  const average = country ? input.averagePerLitre(country) : null;
  if (average == null || place.priceBasis == null) return null;
  return buildFuelAdvice({
    stationPerL: place.priceAmount,
    nationalAvgPerL: average,
    liters,
    basis: place.priceBasis,
  });
}

function priceFor(place: AnnotatedPlace | null): PlanPrice | null {
  if (!place || place.priceAmount == null || place.priceSource == null)
    return null;
  return {
    amount: place.priceAmount,
    currency: "EUR",
    unit: "L",
    source: place.priceSource,
    observed_at: place.observedAt ?? new Date(0).toISOString(),
  };
}
