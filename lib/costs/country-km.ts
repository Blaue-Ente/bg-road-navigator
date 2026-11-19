import { absorbStrays } from "@/lib/geo/country-smooth";
import { haversineKm } from "@/lib/geo/haversine";

/**
 * Kilometres of the route in each country, from points sampled along the line.
 * `countryAt` answers with a country code or null (open sea, unknown), and a gap
 * simply counts for the country before it.
 */
export function kmByCountry(
  coordinates: Array<[number, number]>,
  totalKm: number,
  countryAt: (lng: number, lat: number) => string | null,
  stepKm = 5
): Record<string, number> {
  if (coordinates.length < 2 || totalKm <= 0) return {};
  // Cumulative length of the line, to place each sample.
  const cumulative = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    const a = coordinates[index - 1]!;
    const b = coordinates[index]!;
    cumulative.push(
      cumulative[index - 1]! + haversineKm({ lng: a[0], lat: a[1] }, { lng: b[0], lat: b[1] })
    );
  }
  const lineKm = cumulative[cumulative.length - 1]!;
  if (lineKm <= 0) return {};
  const scale = totalKm / lineKm;
  const samples = Math.max(2, Math.min(600, Math.ceil(lineKm / stepKm)));
  const out: Record<string, number> = {};
  // Where each sample lies, then the country there; a gap counts for the country before it.
  const labels: Array<string | null> = [];
  const positions: number[] = [];
  let segment = 1;
  let previous: string | null = null as string | null;
  for (let sample = 0; sample < samples; sample += 1) {
    const at = ((sample + 0.5) / samples) * lineKm;
    while (segment < cumulative.length - 1 && cumulative[segment]! < at) segment += 1;
    const from = coordinates[segment - 1]!;
    const to = coordinates[segment]!;
    const span = cumulative[segment]! - cumulative[segment - 1]!;
    const ratio = span > 0 ? (at - cumulative[segment - 1]!) / span : 0;
    const lng = from[0] + (to[0] - from[0]) * ratio;
    const lat = from[1] + (to[1] - from[1]) * ratio;
    const country: string | null = countryAt(lng, lat) ?? previous;
    if (country) previous = country;
    labels.push(country);
    positions.push(at);
  }
  // A short run between two stretches of one other country is an outline error, not a transit.
  const smoothed = absorbStrays(labels, positions, lineKm / samples);
  for (const country of smoothed) {
    if (!country) continue;
    out[country] = (out[country] ?? 0) + (lineKm / samples) * scale;
  }
  for (const code of Object.keys(out)) out[code] = Math.round(out[code]! * 10) / 10;
  return out;
}
