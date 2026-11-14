import { describe, expect, it } from "vitest";
import {
  locationBiasScale,
  mapPhotonCollection,
  photonLanguage,
  resolveGeocodeBias,
  type PhotonFeature,
} from "@/lib/api-clients/photon";

describe("mapPhotonCollection", () => {
  it("puts the obvious city or station first", () => {
    expect(firstLabel("Sofia", sofiaFeatures())).toBe("София");
    expect(firstCountry("Sofia", sofiaFeatures())).toBe("BG");

    expect(firstLabel("Plovdiv", plovdivFeatures())).toBe("Пловдив");
    expect(firstLabel("München", munichFeatures())).toBe("München");
    expect(firstLabel("Istanbul", istanbulFeatures())).toBe("İstanbul");
    expect(firstLabel("Wien Hauptbahnhof", viennaFeatures())).toBe(
      "Wien Hauptbahnhof"
    );
  });

  it("keeps a street address ahead of the city centroid", () => {
    const places = mapPhotonCollection(
      {
        features: [
          place({
            name: "булевард Витоша 1",
            osm_value: "house",
            osm_key: "building",
            countrycode: "BG",
            coordinates: [23.322, 42.693],
            city: "София",
          }),
          place({
            name: "София",
            osm_value: "city",
            osm_key: "place",
            countrycode: "BG",
            coordinates: [23.3219, 42.6977],
            extent: [23.2, 42.8, 23.5, 42.6],
          }),
        ],
      },
      "бул. Витоша 1, София"
    );
    expect(places[0]?.label).toBe("булевард Витоша 1");
  });

  it("maps a feature onto the existing geocoder place", () => {
    const [place] = mapPhotonCollection(
      {
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [23.3219, 42.6977] },
            properties: {
              osm_type: "R",
              osm_id: 42,
              name: "София",
              country: "България",
              countrycode: "bg",
              osm_key: "place",
              osm_value: "city",
            },
          },
        ],
      },
      "София"
    );
    expect(place).toMatchObject({
      id: "geocode:R:42",
      label: "София",
      subtitle: "България",
      source: "geocoder",
      countryCode: "BG",
      coords: { lng: 23.3219, lat: 42.6977 },
    });
  });
});

describe("photon bias", () => {
  it("defaults to the Sofia map view and keeps Bulgarian as the language", () => {
    expect(resolveGeocodeBias()).toEqual({
      lat: 42.6977,
      lon: 23.3219,
      zoom: 7,
    });
    expect(locationBiasScale(7)).toBeGreaterThan(0.4);
    expect(locationBiasScale(14)).toBeLessThan(locationBiasScale(7));
    expect(photonLanguage(undefined)).toBe("bg");
    expect(photonLanguage("en-US")).toBe("en");
    expect(photonLanguage("fr")).toBe("bg");
  });
});

function firstLabel(
  query: string,
  features: PhotonFeature[]
): string | undefined {
  return mapPhotonCollection({ features }, query)[0]?.label;
}

function firstCountry(
  query: string,
  features: PhotonFeature[]
): string | undefined {
  return mapPhotonCollection({ features }, query)[0]?.countryCode;
}

function sofiaFeatures(): PhotonFeature[] {
  return [
    place({
      name: "Sofia",
      osm_value: "village",
      osm_key: "place",
      countrycode: "MD",
      coordinates: [28.21, 46.45],
      extent: [28.2, 46.46, 28.22, 46.44],
    }),
    place({
      name: "Sofia",
      osm_value: "hamlet",
      osm_key: "place",
      countrycode: "MD",
      coordinates: [28.4, 47.1],
      extent: [28.39, 47.11, 28.41, 47.09],
    }),
    place({
      name: "София",
      osm_value: "city",
      osm_key: "place",
      countrycode: "BG",
      coordinates: [23.3219, 42.6977],
      extent: [23.2, 42.8, 23.5, 42.6],
    }),
  ];
}

function plovdivFeatures(): PhotonFeature[] {
  return [
    place({
      name: "Plovdiv",
      osm_value: "village",
      osm_key: "place",
      countrycode: "MD",
      coordinates: [28.1, 46.8],
      extent: [28.09, 46.81, 28.11, 46.79],
    }),
    place({
      name: "Пловдив",
      osm_value: "city",
      osm_key: "place",
      countrycode: "BG",
      coordinates: [24.7453, 42.1354],
      extent: [24.68, 42.2, 24.82, 42.08],
    }),
  ];
}

function munichFeatures(): PhotonFeature[] {
  return [
    place({
      name: "München",
      osm_value: "suburb",
      osm_key: "place",
      countrycode: "DE",
      coordinates: [11.5, 48.1],
      extent: [11.49, 48.11, 11.51, 48.09],
    }),
    place({
      name: "München",
      osm_value: "city",
      osm_key: "place",
      countrycode: "DE",
      coordinates: [11.5755, 48.1374],
      extent: [11.36, 48.25, 11.72, 48.06],
    }),
  ];
}

function istanbulFeatures(): PhotonFeature[] {
  return [
    place({
      name: "İstanbul",
      osm_value: "town",
      osm_key: "place",
      countrycode: "TR",
      coordinates: [28.7, 41.2],
      extent: [28.69, 41.21, 28.71, 41.19],
    }),
    place({
      name: "İstanbul",
      osm_value: "city",
      osm_key: "place",
      countrycode: "TR",
      coordinates: [28.9784, 41.0082],
      extent: [28.6, 41.3, 29.3, 40.8],
    }),
  ];
}

function viennaFeatures(): PhotonFeature[] {
  return [
    place({
      name: "Wien",
      osm_value: "city",
      osm_key: "place",
      countrycode: "AT",
      coordinates: [16.3738, 48.2082],
      extent: [16.18, 48.32, 16.58, 48.12],
    }),
    place({
      name: "Wien Hauptbahnhof",
      osm_value: "station",
      osm_key: "railway",
      countrycode: "AT",
      city: "Wien",
      coordinates: [16.377, 48.185],
    }),
  ];
}

function place(input: {
  name: string;
  osm_value: string;
  osm_key: string;
  countrycode: string;
  coordinates: [number, number];
  extent?: number[];
  city?: string;
}): PhotonFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: input.coordinates },
    properties: {
      osm_id: input.coordinates[0],
      osm_type: "N",
      name: input.name,
      osm_key: input.osm_key,
      osm_value: input.osm_value,
      countrycode: input.countrycode,
      city: input.city,
      extent: input.extent,
    },
  };
}
