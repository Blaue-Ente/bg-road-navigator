import type { FuelTypeCode } from "@/types/fuel.types";

const TAGS: Array<{ code: FuelTypeCode; keys: string[] }> = [
  { code: "diesel", keys: ["fuel:diesel", "fuel:diesel:class2"] },
  { code: "petrol95", keys: ["fuel:octane_95", "fuel:e10", "fuel:e5"] },
  { code: "petrol98", keys: ["fuel:octane_98", "fuel:octane_100"] },
  { code: "lpg", keys: ["fuel:lpg"] },
  { code: "cng", keys: ["fuel:cng", "fuel:lng"] },
  { code: "adblue", keys: ["fuel:adblue"] },
  { code: "e85", keys: ["fuel:e85"] },
  { code: "hvo", keys: ["fuel:hvo", "fuel:GTL_diesel"] },
];

/** Fuels an OpenStreetMap station says it sells (`fuel:*=yes`). */
export function fuelTypesFromTags(tags: Record<string, string>): FuelTypeCode[] {
  return TAGS.filter(({ keys }) => keys.some((key) => tags[key] === "yes")).map(
    ({ code }) => code
  );
}

/** A one-line address from the usual OpenStreetMap address tags. */
export function addressFromTags(tags: Record<string, string>): string | undefined {
  if (tags["addr:full"]) return tags["addr:full"];
  const street = [tags["addr:street"], tags["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  const town = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
  const line = [street, town].filter(Boolean).join(", ");
  return line || undefined;
}
