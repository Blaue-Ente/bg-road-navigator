import { describe, expect, it } from "vitest";
import { parseAlarms, weatherAlongRoute } from "@/lib/planner/route-weather";

describe("route weather", () => {
  it("picks the forecast hour closest to the pass time", async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("meteoalarm")) {
        return Response.json({
          warnings: [
            {
              event: "Wind",
              severity: "Moderate",
              description: "Strong wind in the west.",
            },
          ],
        });
      }
      return Response.json([
        hourly("2026-11-15T08:00", 8, 1),
        hourly("2026-11-15T10:00", 11, 3),
        hourly("2026-11-15T12:00", 14, 65),
        hourly("2026-11-15T14:00", 9, 0),
      ]);
    }) as typeof fetch;

    const weather = await weatherAlongRoute({
      line: [
        [23.32, 42.7],
        [24.75, 42.14],
      ],
      departAt: new Date("2026-11-15T08:00:00.000Z"),
      durationMin: 360,
      distanceKm: 140,
      fetchImpl,
    });
    expect(weather.attribution).toContain("Open-Meteo");
    expect(weather.segments[0]?.temperature_c).toBe(8);
    expect(weather.segments[3]?.summary_bg).toContain("ясно");
    expect(weather.warnings.some((warning) => warning.source === "meteoalarm")).toBe(
      true
    );
    expect(
      weather.warnings.some((warning) => warning.source === "open-meteo")
    ).toBe(true);
  });

  it("ignores an alarm payload that is not a warning list", () => {
    expect(parseAlarms({ html: "<p>no</p>" }, "BG")).toEqual([]);
  });
});

function hourly(time: string, temperature: number, code: number) {
  return {
    hourly: {
      time: [time],
      temperature_2m: [temperature],
      weather_code: [code],
      wind_speed_10m: [12],
      precipitation: [code >= 61 ? 1.2 : 0],
    },
  };
}
