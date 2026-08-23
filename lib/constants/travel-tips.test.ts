import { describe, expect, it } from "vitest";
import { selectTipsForRoute } from "@/lib/constants/travel-tips";

describe("selectTipsForRoute", () => {
  it("keeps ferry advice only for UK trips", () => {
    const withUk = selectTipsForRoute(
      {
        countryCodes: ["GB", "FR", "DE", "BG"],
        durationMin: 32 * 60,
        month: 8,
        hasBorders: true,
        vehicleType: "car",
      },
      8
    );
    expect(withUk.some((tip) => tip.id === "ferry-calais")).toBe(true);

    const inland = selectTipsForRoute(
      {
        countryCodes: ["DE", "AT", "HU", "RS", "BG"],
        durationMin: 13 * 60,
        month: 8,
        hasBorders: true,
        vehicleType: "car",
      },
      8
    );
    expect(inland.some((tip) => tip.id === "ferry-calais")).toBe(false);
  });

  it("hides EV tips for a petrol car", () => {
    const tips = selectTipsForRoute({
      countryCodes: ["AT", "BG"],
      durationMin: 700,
      month: 8,
      hasBorders: true,
      vehicleType: "car",
    });
    expect(tips.some((tip) => tip.id === "ev-charging")).toBe(false);
  });
});
