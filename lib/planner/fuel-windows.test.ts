import { describe, expect, it } from "vitest";
import { fuelWindows } from "@/lib/planner/fuel-windows";
import type { ResolvedVehicle } from "@/lib/planner/vehicle";

const car: ResolvedVehicle = {
  vehicle_type: "car",
  fuel_type: "petrol",
  energy: "fuel",
  capacity: 50,
  consumption_per_100: 5,
  level: 0.8,
  reserve: 0.15,
};

describe("fuelWindows", () => {
  it("places a stop before the reserve and assumes a full refill", () => {
    const windows = fuelWindows(1600, car, {
      windowKm: 40,
      destinationSlackKm: 5,
    });
    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      mustStopKm: 650,
      windowStartKm: 610,
      windowEndKm: 650,
    });
    expect(windows[1]).toMatchObject({
      mustStopKm: 1500,
      windowStartKm: 1460,
      windowEndKm: 1500,
    });
  });

  it("asks for fuel before departure when the tank is already on the reserve", () => {
    const windows = fuelWindows(
      400,
      { ...car, level: 0.1 },
      {
        windowKm: 40,
        destinationSlackKm: 5,
      }
    );
    expect(windows[0]?.mustStopKm).toBe(0);
    expect(windows).toHaveLength(1);
  });

  it("plans no stop when the destination is inside the usable range", () => {
    expect(fuelWindows(400, car)).toEqual([]);
  });
});
