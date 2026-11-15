import { describe, expect, it, vi } from "vitest";
import { resolveStationPrice } from "@/lib/fuel-prices/resolve";

const now = new Date("2026-11-14T12:00:00.000Z");

function fetchMock(payload: unknown, status = 200) {
  return vi.fn(
    async () => new Response(JSON.stringify(payload), { status })
  ) as unknown as typeof fetch;
}

describe("fuel price providers", () => {
  it.each(["BG", "RS", "HU", "RO", "TR"])(
    "returns price unknown for %s and does not call a provider",
    async (countryCode) => {
      const fetchImpl = fetchMock([]);
      const result = await resolveStationPrice(
        { countryCode, fuel: "diesel", lat: 42.7, lng: 23.3 },
        { fetchImpl, now }
      );
      expect(result).toEqual({ price: null, reason: "price unknown" });
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  );

  it("skips Tankerkönig when the key is unset", async () => {
    vi.stubEnv("TANKERKOENIG_API_KEY", "");
    const fetchImpl = fetchMock({});
    const result = await resolveStationPrice(
      { countryCode: "DE", fuel: "diesel", lat: 52.5, lng: 13.4 },
      { fetchImpl, now, tankerkoenigKey: "" }
    );
    expect(result.reason).toBe("price unknown");
    expect(result.price).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads an E-Control amount and does not invent one when the list is empty", async () => {
    const fetchImpl = fetchMock([
      {
        name: "Turmöl Quick",
        location: { latitude: 48.21, longitude: 16.37 },
        prices: [{ fuelType: "DIE", amount: 2.017, label: "Diesel" }],
      },
    ]);
    const known = await resolveStationPrice(
      { countryCode: "AT", fuel: "diesel", lat: 48.208, lng: 16.373 },
      { fetchImpl, now }
    );
    expect(known.price).toMatchObject({
      amount: 2.017,
      currency: "EUR",
      source: "e-control",
      observedAt: now.toISOString(),
    });

    const empty = await resolveStationPrice(
      { countryCode: "AT", fuel: "diesel", lat: 48.208, lng: 16.373 },
      { fetchImpl: fetchMock([]), now }
    );
    expect(empty).toEqual({ price: null, reason: "price unknown" });
  });

  it("returns price unknown when E-Control fails", async () => {
    const result = await resolveStationPrice(
      { countryCode: "AT", fuel: "petrol", lat: 48.2, lng: 16.3 },
      { fetchImpl: fetchMock({ error: true }, 500), now }
    );
    expect(result).toEqual({ price: null, reason: "price unknown" });
  });

  it("uses the requested Tankerkönig grade and ignores a different one", async () => {
    const fetchImpl = fetchMock({
      ok: true,
      stations: [
        {
          name: "Aral",
          brand: "ARAL",
          lat: 52.52,
          lng: 13.4,
          diesel: null,
          e5: 1.79,
        },
      ],
    });
    const diesel = await resolveStationPrice(
      { countryCode: "DE", fuel: "diesel", lat: 52.52, lng: 13.405 },
      { fetchImpl, now, tankerkoenigKey: "test-key" }
    );
    expect(diesel).toEqual({ price: null, reason: "price unknown" });

    const petrol = await resolveStationPrice(
      { countryCode: "DE", fuel: "petrol", lat: 52.52, lng: 13.405 },
      {
        fetchImpl: fetchMock({
          ok: true,
          stations: [
            {
              name: "Aral",
              brand: "ARAL",
              lat: 52.52,
              lng: 13.4,
              diesel: 1.59,
              e5: 1.79,
            },
          ],
        }),
        now,
        tankerkoenigKey: "test-key",
      }
    );
    expect(petrol.price).toMatchObject({
      amount: 1.79,
      source: "tankerkoenig",
      brand: "ARAL",
    });
  });
});
