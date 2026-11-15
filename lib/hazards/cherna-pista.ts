/**
 * Optional raw GeoJSON overlay. Clustered Bulgarian hotspots come from the
 * Cherna Pista snapshot in lib/hotspots/data and do not use this flag.
 */
export const CHERNA_PISTA_ATTRIBUTION =
  "Данни: Черна писта, chernapista.com, CC BY 4.0, по данни на МВР; данните са обработени";

export interface ChernaPistaLayer {
  enabled: boolean;
  attribution: string;
  features: GeoJSON.Feature[];
}

export function chernaPistaEnabled(
  flag = process.env.CHERNA_PISTA_LAYER
): boolean {
  return flag === "1";
}

export function loadChernaPistaGeoJson(
  raw: string | null | undefined,
  flag = process.env.CHERNA_PISTA_LAYER
): ChernaPistaLayer {
  if (!chernaPistaEnabled(flag)) {
    return {
      enabled: false,
      attribution: CHERNA_PISTA_ATTRIBUTION,
      features: [],
    };
  }
  return {
    enabled: true,
    attribution: CHERNA_PISTA_ATTRIBUTION,
    features: featuresFrom(raw),
  };
}

function featuresFrom(raw: string | null | undefined): GeoJSON.Feature[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return [];
    const row = parsed as { type?: string; features?: unknown };
    if (row.type !== "FeatureCollection" || !Array.isArray(row.features)) {
      return [];
    }
    return row.features.filter(
      (feature): feature is GeoJSON.Feature =>
        Boolean(feature) &&
        typeof feature === "object" &&
        (feature as GeoJSON.Feature).type === "Feature"
    );
  } catch {
    return [];
  }
}
