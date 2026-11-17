import { describe, expect, it } from "vitest";
import { fuelStopStations } from "@/lib/planner/run-plan";

const place = (id: string, alongKm: number, detourKm = 0.5, kind = "fuel") => ({
  id,
  kind,
  lat: 50,
  lng: 10,
  alongKm,
  detourKm,
});

describe("fuelStopStations", () => {
  it("picks stations before each fuel stop, not just the first on the route", () => {
    const places = [
      place("early-1", 70),
      place("early-2", 90),
      place("mid-near", 690, 0.2),
      place("mid-far", 680, 3),
      place("rest", 690, 0.1, "restaurant"),
      place("after", 700),
    ];
    const ids = fuelStopStations(places, [
      { kinds: ["fuel"], distanceKm: 100 },
      { kinds: ["fuel", "rest"], distanceKm: 694 },
      { kinds: ["rest"], distanceKm: 400 },
    ]);
    expect(ids).toEqual(["early-1", "early-2", "mid-near", "mid-far"]);
  });

  it("caps the stations per stop", () => {
    const places = Array.from({ length: 10 }, (_, i) =>
      place(`s${i}`, 90 + i * 0.5, i)
    );
    expect(
      fuelStopStations(places, [{ kinds: ["fuel"], distanceKm: 100 }])
    ).toHaveLength(4);
  });
});
