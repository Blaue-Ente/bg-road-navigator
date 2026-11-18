import { describe, expect, it } from "vitest";
import { applyOfficialPrices } from "@/lib/fuel/station-prices";
import { addressFromTags, fuelTypesFromTags } from "@/lib/fuel/station-tags";
import type { KnownPrice } from "@/lib/fuel-prices/types";
import type { FuelStation } from "@/types/fuel.types";

function station(id: string, lng: number, lat: number, prices = {}): FuelStation {
  return {
    id,
    name: "Aral",
    brand: "Aral",
    coords: { lng, lat },
    prices,
    open: "unknown",
    distance_km: 1,
    payment_methods: [],
  };
}

function price(amount: number, lng: number, lat: number): KnownPrice {
  return {
    amount,
    currency: "EUR",
    unit: "L",
    source: "tankerkoenig",
    observedAt: "2026-11-18T08:00:00.000Z",
    stationName: "Aral",
    brand: "Aral",
    lat,
    lng,
  };
}

describe("official station prices", () => {
  it("fills a price from the list entry on the same spot, not from one further away", () => {
    const [near, far] = applyOfficialPrices(
      [station("a", 13.4, 52.5), station("b", 13.5, 52.5)],
      {
        diesel: [price(1.71, 13.4001, 52.5001)],
        petrol: [price(1.83, 13.4001, 52.5001)],
      }
    );
    expect(near?.prices).toEqual({ diesel: 1.71, petrol95: 1.83 });
    expect(near?.price_source).toBe("tankerkoenig");
    expect(far?.prices).toEqual({});
    expect(far?.price_source).toBeUndefined();
  });

  it("keeps a price the station already has", () => {
    const [kept] = applyOfficialPrices([station("a", 13.4, 52.5, { diesel: 1.5, petrol95: 1.6 })], {
      diesel: [price(1.71, 13.4, 52.5)],
      petrol: [price(1.83, 13.4, 52.5)],
    });
    expect(kept?.prices).toEqual({ diesel: 1.5, petrol95: 1.6 });
  });
});

describe("station tags", () => {
  it("lists the fuels a station says it sells", () => {
    expect(
      fuelTypesFromTags({ "fuel:diesel": "yes", "fuel:octane_95": "yes", "fuel:lpg": "no" })
    ).toEqual(["diesel", "petrol95"]);
  });

  it("builds an address line from the usual tags", () => {
    expect(
      addressFromTags({
        "addr:street": "Allee der Kosmonauten",
        "addr:housenumber": "115",
        "addr:postcode": "12681",
        "addr:city": "Berlin",
      })
    ).toBe("Allee der Kosmonauten 115, 12681 Berlin");
    expect(addressFromTags({})).toBeUndefined();
  });
});
