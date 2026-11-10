import { describe, expect, it } from "vitest";
import { rankNominatimResults, streetAndCity } from "@/lib/api-clients/nominatim";

describe("rankNominatimResults", () => {
  it("puts a house address ahead of a city centroid", () => {
    const ranked = rankNominatimResults(
      [
        {
          place_id: 1,
          osm_type: "relation",
          osm_id: 1,
          display_name: "София, България",
          lat: "42.7",
          lon: "23.3",
          type: "city",
          address: { city: "София", country: "България" },
        },
        {
          place_id: 2,
          osm_type: "node",
          osm_id: 2,
          display_name: "1, булевард Витоша, София, България",
          lat: "42.69",
          lon: "23.32",
          type: "house",
          address: {
            road: "булевард Витоша",
            house_number: "1",
            city: "София",
            country: "България",
          },
        },
      ],
      "бул. Витоша 1, София"
    );
    expect(ranked[0]?.place_id).toBe(2);
  });

  it("prefers the named road over a memorial that only shares the display name", () => {
    const ranked = rankNominatimResults(
      [
        {
          place_id: 1,
          osm_type: "node",
          osm_id: 1,
          display_name: "Стефан Стамболов, Георги Сава Раковски, Велико Търново",
          lat: "43.08",
          lon: "25.63",
          type: "memorial",
          name: "Стефан Стамболов",
          address: { road: "Георги Сава Раковски", city: "Велико Търново" },
        },
        {
          place_id: 2,
          osm_type: "way",
          osm_id: 2,
          display_name: "бул. Стефан Стамболов, Велико Търново",
          lat: "43.083",
          lon: "25.639",
          type: "tertiary",
          name: "бул. Стефан Стамболов",
          address: { road: "бул. Стефан Стамболов", city: "Велико Търново" },
        },
      ],
      "ул. Стефан Стамболов 1, Велико Търново"
    );
    expect(ranked[0]?.place_id).toBe(2);
  });

  it("prefers the pedestrian street when several roads share the name", () => {
    const ranked = rankNominatimResults(
      [
        {
          place_id: 1,
          osm_type: "way",
          osm_id: 1,
          display_name: "Αριστοτέλους, Thessaloniki",
          lat: "40.49",
          lon: "22.88",
          type: "residential",
          importance: 0.05,
          address: { road: "Αριστοτέλους", city: "Thessaloniki" },
        },
        {
          place_id: 2,
          osm_type: "way",
          osm_id: 2,
          display_name: "Αριστοτέλους, Thessaloniki",
          lat: "40.63",
          lon: "22.94",
          type: "pedestrian",
          importance: 0.05,
          address: { road: "Αριστοτέλους", city: "Thessaloniki" },
        },
      ],
      "Αριστοτέλους, Θεσσαλονίκη"
    );
    expect(ranked[0]?.place_id).toBe(2);
  });
});

describe("streetAndCity", () => {
  it("keeps the house number and drops the street prefix", () => {
    expect(streetAndCity("ул. Александровска 1, Бургас")).toEqual({
      street: "Александровска 1",
      city: "Бургас",
    });
  });
});

describe("rankNominatimResults", () => {
  it("puts a house address ahead of a city centroid", () => {
    const ranked = rankNominatimResults(
      [
        {
          place_id: 1,
          osm_type: "relation",
          osm_id: 1,
          display_name: "София, България",
          lat: "42.7",
          lon: "23.3",
          type: "city",
          address: { city: "София", country: "България" },
        },
        {
          place_id: 2,
          osm_type: "node",
          osm_id: 2,
          display_name: "1, булевард Витоша, София, България",
          lat: "42.69",
          lon: "23.32",
          type: "house",
          address: {
            road: "булевард Витоша",
            house_number: "1",
            city: "София",
            country: "България",
          },
        },
      ],
      "бул. Витоша 1, София"
    );
    expect(ranked[0]?.place_id).toBe(2);
  });
});
