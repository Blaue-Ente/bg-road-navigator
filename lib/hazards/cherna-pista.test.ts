import { describe, expect, it } from "vitest";
import {
  CHERNA_PISTA_ATTRIBUTION,
  loadChernaPistaGeoJson,
} from "@/lib/hazards/cherna-pista";

const GEOJSON = JSON.stringify({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [23.32, 42.7] },
      properties: { year: 2022 },
    },
  ],
});

describe("Cherna pista layer", () => {
  it("stays empty and still carries the CC BY attribution while the flag is off", () => {
    const layer = loadChernaPistaGeoJson(GEOJSON, "");
    expect(layer.enabled).toBe(false);
    expect(layer.features).toEqual([]);
    expect(layer.attribution).toBe(CHERNA_PISTA_ATTRIBUTION);
  });

  it("reads a GeoJSON file the caller already has when the flag is on", () => {
    const layer = loadChernaPistaGeoJson(GEOJSON, "1");
    expect(layer.enabled).toBe(true);
    expect(layer.features).toHaveLength(1);
    expect(loadChernaPistaGeoJson("not json", "1").features).toEqual([]);
    expect(loadChernaPistaGeoJson(null, "1").features).toEqual([]);
  });
});
