import { reversePlace } from "@/lib/api-clients/geocoding";
import { countryCodeAtPoint } from "@/lib/geo/countries-along-route";
import { countryName } from "@/lib/geo/country-name";
import type { Locale } from "@/lib/i18n/locale";
import type { RoutePoint } from "@/types/route.types";

const REVERSE_TIMEOUT_MS = 3_500;

/** "Niš, Serbia" from a reverse-geocoded point; the place name alone when the country is unknown. */
export function weatherPlaceLabel(
  place: Pick<RoutePoint, "label" | "subtitle" | "countryCode"> | null,
  fallbackCountry: string | null,
  locale: Locale
): string | null {
  const countryCode = place?.countryCode ?? fallbackCountry;
  const country = countryCode ? countryName(countryCode, locale) : null;
  const parts = (place?.subtitle ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const locality =
    parts.find((part) => part !== country && part !== place?.label) ??
    place?.label ??
    null;
  const name = locality && locality !== country ? locality : null;
  if (name && country) return `${name}, ${country}`;
  return name ?? country;
}

/**
 * Where the driver is expected to be at each forecast time. Failed or slow
 * lookups fall back to the country, so the forecast never waits on a geocoder.
 */
export async function placesForSamples(
  samples: Array<{ lat: number; lng: number }>,
  locale: Locale,
  lookup: (
    lat: number,
    lng: number,
    lang: string
  ) => Promise<RoutePoint | null> = (lat, lng, lang) =>
    reversePlace(lat, lng, { lang })
): Promise<Array<string | null>> {
  return Promise.all(
    samples.map(async (sample) => {
      const country = countryCodeAtPoint(sample.lng, sample.lat);
      let place: RoutePoint | null = null;
      try {
        place = await Promise.race([
          lookup(sample.lat, sample.lng, locale),
          new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), REVERSE_TIMEOUT_MS)
          ),
        ]);
      } catch {
        place = null;
      }
      return weatherPlaceLabel(place, country, locale);
    })
  );
}
