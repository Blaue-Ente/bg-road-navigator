import { describe, expect, it } from "vitest";
import {
  fuelPageUsesBulgariaSubtitle,
  fuelPageViewModel,
} from "@/lib/fuel/fuel-page-view";

describe("fuelPageViewModel", () => {
  it("uses unavailable copy on fetch error", () => {
    expect(fuelPageViewModel({ fetchStatus: "error", stationCount: 0 })).toEqual({
      listStatus: "error",
      emptyCopyKey: "unavailable",
      showRetry: true,
      showPlanLink: true,
    });
  });

  it("uses noneHere when the API succeeded but the list is empty", () => {
    expect(
      fuelPageViewModel({ fetchStatus: "ok", stationCount: 0, degraded: false })
    ).toMatchObject({ emptyCopyKey: "noneHere" });
  });

  it("uses unavailable when degraded with no stations", () => {
    expect(
      fuelPageViewModel({ fetchStatus: "ok", stationCount: 0, degraded: true })
    ).toMatchObject({ emptyCopyKey: "unavailable" });
  });
});

describe("fuelPageUsesBulgariaSubtitle", () => {
  it("shows Bulgaria copy for the default bbox centre", () => {
    expect(fuelPageUsesBulgariaSubtitle("default", 42.7, 23.32)).toBe(true);
  });

  it("skips Bulgaria copy on an active route", () => {
    expect(fuelPageUsesBulgariaSubtitle("route", 42.7, 23.32)).toBe(false);
  });
});