import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PHOTON_COLD_TIMEOUT_MS,
  PHOTON_TIMEOUT_MS,
} from "@/lib/api-clients/oci-geo";
import {
  clearPhotonCacheForTests,
  locationBiasScale,
  mapPhotonCollection,
  notePhotonSuccess,
  parseAddressQuery,
  photonLanguage,
  photonRequestTimeout,
  resolveGeocodeBias,
  searchPhoton,
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

describe("house numbers", () => {
  afterEach(() => {
    clearPhotonCacheForTests();
    vi.unstubAllGlobals();
  });

  it("parses street-first and number-first queries and ignores street prefixes", () => {
    expect(parseAddressQuery("Витоша 1, София")).toEqual({
      housenumber: "1",
      street: "Витоша",
      city: "София",
    });
    expect(parseAddressQuery("1 Витоша, София")).toEqual({
      housenumber: "1",
      street: "Витоша",
      city: "София",
    });
    expect(parseAddressQuery("бул. Витоша 1, София")).toEqual({
      housenumber: "1",
      street: "Витоша",
      city: "София",
    });
    expect(parseAddressQuery("ул. Александровска 12а, Бургас")).toEqual({
      housenumber: "12а",
      street: "Александровска",
      city: "Бургас",
    });
    expect(parseAddressQuery("ulitsa Vitoshka 5, Sofia")).toMatchObject({
      housenumber: "5",
      street: "Vitoshka",
      city: "Sofia",
    });
    expect(parseAddressQuery("Alexanderplatz 1, Berlin")).toEqual({
      housenumber: "1",
      street: "Alexanderplatz",
      city: "Berlin",
    });
    expect(parseAddressQuery("Mariahilfer Straße 100, Wien")).toEqual({
      housenumber: "100",
      street: "Mariahilfer Straße",
      city: "Wien",
    });
    expect(parseAddressQuery("Mariahilfer Str. 100, Wien")?.street).toBe(
      "Mariahilfer Str."
    );
    expect(parseAddressQuery("Sofia")).toBeNull();
    expect(parseAddressQuery("Plovdiv")).toBeNull();
    expect(parseAddressQuery("Wien Hauptbahnhof")).toBeNull();
  });

  it("ranks Витоша ahead of another house number 1", () => {
    const features: PhotonFeature[] = [
      addressFeature({
        name: "Димитър Манчев 1",
        street: "ул. Димитър Манчев",
        housenumber: "1",
        city: "София",
        countrycode: "BG",
        coordinates: [23.33, 42.69],
        osm_key: "building",
        osm_value: "house",
      }),
      addressFeature({
        name: "бул. Витоша 1",
        street: "bul. Vitosha",
        housenumber: "1",
        city: "София",
        countrycode: "BG",
        coordinates: [23.3215, 42.697],
        osm_key: "building",
        osm_value: "house",
      }),
    ];
    features[0]!.properties!.importance = 1;
    features[1]!.properties!.importance = 0.05;
    expect(firstLabel("Витоша 1, София", features)).toBe("bul. Vitosha 1");
    expect(firstLabel("Vitosha 1, Sofia", features)).toBe("bul. Vitosha 1");
  });

  it("ranks the exact street and house number ahead of Photon's order", () => {
    expect(firstLabel("Витоша 1, София", vitoshaFeatures())).toBe(
      "булевард Витоша 1"
    );
    expect(firstLabel("бул. Витоша 1, София", vitoshaFeatures())).toBe(
      "булевард Витоша 1"
    );
    expect(firstLabel("1 Витоша, София", vitoshaFeatures())).toBe(
      "булевард Витоша 1"
    );
    expect(
      firstLabel("Alexanderplatz 1, Berlin", alexanderplatzFeatures())
    ).toBe("Alexanderplatz 1");
    expect(
      firstLabel("Mariahilfer Straße 100, Wien", mariahilferFeatures())
    ).toBe("Mariahilfer Str. 100");
  });

  it("keeps a city query on the city ranking when there is no house number", () => {
    expect(firstLabel("Sofia", sofiaFeatures())).toBe("София");
    expect(firstLabel("София", sofiaStreetFeatures())).toBe("София");
    expect(firstLabel("Plovdiv", plovdivFeatures())).toBe("Пловдив");
    const berlin = berlinFeatures();
    berlin[0]!.properties!.importance = 0.95;
    berlin[1]!.properties!.importance = 0.4;
    expect(firstLabel("Berlin", berlin)).toBe("Berlin");
  });

  it("ranks BG Sofia above MD Sofia on an exact name match", () => {
    const features: PhotonFeature[] = [
      place({
        name: "Sofia",
        osm_value: "village",
        osm_key: "place",
        countrycode: "MD",
        coordinates: [28.21, 46.45],
        extent: [28.2, 46.46, 28.22, 46.44],
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
    features[0]!.properties!.importance = 0.9;
    features[1]!.properties!.importance = 0.2;
    expect(firstCountry("Sofia", features)).toBe("BG");
    expect(firstLabel("Sofia", features)).toBe("София");
  });

  it("uses a longer Photon timeout only until the process has heard back", () => {
    clearPhotonCacheForTests();
    expect(photonRequestTimeout(1_000)).toBe(PHOTON_COLD_TIMEOUT_MS);
    notePhotonSuccess(1_000);
    expect(photonRequestTimeout(1_000 + 60_000)).toBe(PHOTON_TIMEOUT_MS);
    expect(photonRequestTimeout(1_000 + 8 * 60 * 1000)).toBe(
      PHOTON_COLD_TIMEOUT_MS
    );
  });

  it("asks Photon for a wider list and fills a missing house from structured search", async () => {
    const seen: string[] = [];
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        seen.push(url);
        expect(new Headers(init?.headers).get("X-API-Key")).toBe(
          "server-key-123"
        );
        expect(url).not.toContain("server-key-123");
        if (url.includes("/photon/structured")) {
          return Response.json({
            features: [vitoshaFeatures()[2]],
          });
        }
        return Response.json({ features: [vitoshaFeatures()[0]] });
      }
    );

    const result = await searchPhoton(
      "Витоша 1, София",
      { lat: 42.7, lon: 23.32, zoom: 12, lang: "bg" },
      { baseUrl: "https://geo.example", apiKey: "server-key-123" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.places[0]?.label).toBe("булевард Витоша 1");
    expect(seen).toHaveLength(2);
    const free = new URL(seen[0]!);
    expect(free.pathname).toBe("/photon/api");
    expect(free.searchParams.get("limit")).toBe("30");
    const structured = new URL(seen[1]!);
    expect(structured.pathname).toBe("/photon/structured");
    expect(structured.searchParams.get("street")).toBe("Витоша");
    expect(structured.searchParams.get("housenumber")).toBe("1");
    expect(structured.searchParams.get("city")).toBe("София");
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
    // Geocoder language follows document lang (also tr/ro for the locale switch).
    expect(photonLanguage("tr")).toBe("tr");
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

function berlinFeatures(): PhotonFeature[] {
  return [
    place({
      name: "Tauentzienstraße",
      street: "Tauentzienstraße",
      osm_value: "primary",
      osm_key: "highway",
      countrycode: "DE",
      city: "Berlin",
      coordinates: [13.344, 52.502],
    }),
    place({
      name: "Berlin",
      osm_value: "city",
      osm_key: "place",
      countrycode: "DE",
      coordinates: [13.405, 52.52],
      extent: [13.08, 52.67, 13.76, 52.33],
    }),
  ];
}

function sofiaStreetFeatures(): PhotonFeature[] {
  return [
    place({
      name: "булевард Витоша",
      street: "булевард Витоша",
      osm_value: "primary",
      osm_key: "highway",
      countrycode: "BG",
      city: "София",
      coordinates: [23.322, 42.692],
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

function vitoshaFeatures(): PhotonFeature[] {
  return [
    addressFeature({
      name: "булевард Черни връх",
      street: "булевард Черни връх",
      city: "София",
      countrycode: "BG",
      coordinates: [23.319, 42.66],
      osm_key: "highway",
      osm_value: "primary",
    }),
    addressFeature({
      name: "булевард Витоша",
      street: "булевард Витоша",
      city: "София",
      countrycode: "BG",
      coordinates: [23.322, 42.692],
      osm_key: "highway",
      osm_value: "primary",
    }),
    addressFeature({
      name: "булевард Витоша 1",
      street: "булевард Витоша",
      housenumber: "1",
      city: "София",
      countrycode: "BG",
      coordinates: [23.3215, 42.697],
      osm_key: "building",
      osm_value: "house",
    }),
  ];
}

function alexanderplatzFeatures(): PhotonFeature[] {
  return [
    addressFeature({
      name: "Dircksenstraße 2",
      street: "Dircksenstraße",
      housenumber: "2",
      city: "Berlin",
      countrycode: "DE",
      coordinates: [13.413, 52.52],
      osm_key: "building",
      osm_value: "house",
    }),
    addressFeature({
      name: "Alexanderstraße 3",
      street: "Alexanderstraße",
      housenumber: "3",
      city: "Berlin",
      countrycode: "DE",
      coordinates: [13.415, 52.519],
      osm_key: "building",
      osm_value: "house",
    }),
    addressFeature({
      name: "Alexanderplatz 7",
      street: "Alexanderplatz",
      housenumber: "7",
      city: "Berlin",
      countrycode: "DE",
      coordinates: [13.4132, 52.5218],
      osm_key: "building",
      osm_value: "house",
    }),
    addressFeature({
      name: "Alexanderplatz 1",
      street: "Alexanderplatz",
      housenumber: "1",
      city: "Berlin",
      countrycode: "DE",
      coordinates: [13.413, 52.5215],
      osm_key: "building",
      osm_value: "house",
    }),
  ];
}

function mariahilferFeatures(): PhotonFeature[] {
  return [
    addressFeature({
      name: "Getreidemarkt 1",
      street: "Getreidemarkt",
      housenumber: "1",
      city: "Wien",
      countrycode: "AT",
      coordinates: [16.363, 48.2],
      osm_key: "building",
      osm_value: "house",
    }),
    addressFeature({
      name: "Mariahilfer Straße 10",
      street: "Mariahilfer Straße",
      housenumber: "10",
      city: "Wien",
      countrycode: "AT",
      coordinates: [16.35, 48.199],
      osm_key: "building",
      osm_value: "house",
    }),
    addressFeature({
      name: "Mariahilfer Straße 100",
      street: "Mariahilfer Str.",
      housenumber: "100",
      city: "Wien",
      countrycode: "AT",
      coordinates: [16.34, 48.197],
      osm_key: "building",
      osm_value: "house",
    }),
  ];
}

function addressFeature(input: {
  name: string;
  street: string;
  housenumber?: string;
  city: string;
  countrycode: string;
  coordinates: [number, number];
  osm_key: string;
  osm_value: string;
}): PhotonFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: input.coordinates },
    properties: {
      osm_id: input.coordinates[0],
      osm_type: "N",
      name: input.name,
      street: input.street,
      housenumber: input.housenumber,
      city: input.city,
      osm_key: input.osm_key,
      osm_value: input.osm_value,
      countrycode: input.countrycode,
      country: input.city,
    },
  };
}

function place(input: {
  name: string;
  osm_value: string;
  osm_key: string;
  countrycode: string;
  coordinates: [number, number];
  extent?: number[];
  city?: string;
  street?: string;
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
      street: input.street,
      extent: input.extent,
    },
  };
}
