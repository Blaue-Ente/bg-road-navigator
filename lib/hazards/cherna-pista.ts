/**
 * Historical crash layer. The Cherna pista files are not downloadable, so this
 * only accepts a GeoJSON string the caller already has. The flag defaults off
 * and the function then returns no features.
 */
export const CHERNA_PISTA_ATTRIBUTION =
  "Данни: Черна писта, chernapista.com, CC BY 4.0, по данни на МВР";

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
