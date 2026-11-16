import { describe, expect, it } from "vitest";
import { weatherCondition, wmoToWeather } from "@/lib/utils/weather-codes";

describe("weatherCondition", () => {
  it("maps code 61 in all locales", () => {
    expect(weatherCondition(61, "bg")).toBe("слаб дъжд");
    expect(weatherCondition(61, "en")).toBe("light rain");
    expect(weatherCondition(61, "tr")).toBe("hafif yağmur");
    expect(weatherCondition(61, "ro")).toBe("ploaie slabă");
  });

  it("keeps wmoToWeather byte-identical for bg", () => {
    expect(wmoToWeather(61)).toEqual({ condition: "слаб дъжд", icon: "rain" });
    expect(wmoToWeather(0)).toEqual({ condition: "ясно", icon: "sun" });
  });
});