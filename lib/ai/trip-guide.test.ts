import { describe, expect, it } from "vitest";
import { parseGuide, tripGuide, TripGuideInputSchema } from "@/lib/ai/trip-guide";

const input = TripGuideInputSchema.parse({
  locale: "bg",
  origin: "Berlin",
  destination: "Bugun",
  distance_km: 1535,
  duration_min: 895,
  travelers: { adults: 2, children_ages: [9], pet: true, drivers: 1 },
  countries: ["DE", "CZ", "HU", "RO"],
  stops: [
    {
      id: "stop-8",
      kind: "overnight",
      title: "Нощувка",
      place: "Cujmir, Румъния",
      km: 1389,
      local_time: "19.12, 13:00",
      detour_km: 0.5,
      facts: ["Близо до Дунав"],
    },
  ],
  food_spots: [{ chain: "McDonald's", km: 520, local_time: "12:40", detour_km: 0.4 }],
  weather: ["19 Dec, 13:00, Arad, 2C, light rain"],
  vignettes: ["Bulgaria e-vignette"],
  days: [{ day: 1, from_km: 0, to_km: 1389, ends_local: "19 Dec, 13:00", ends_at_stop: "stop-8" }],
});

describe("trip guide", () => {
  it("reads the JSON even inside a code fence", () => {
    const guide = parseGuide(
      '```json\n{"title":"Berlin to Bugun","intro":"A long drive.","sections":[{"heading":"Day 1","text":"Leave early."}],"overnight":[{"stop_id":"stop-8","where":"Cujmir","why":"Halfway.","check":["parking"]}],"closing":"Safe trip."}\n```'
    );
    expect(guide?.overnight[0]?.stop_id).toBe("stop-8");
    expect(guide?.sections[0]?.heading).toBe("Day 1");
    expect(guide?.closing).toBe("Safe trip.");
  });

  it("rejects an answer that is not JSON", () => {
    expect(parseGuide("Sorry, I can't")).toBeNull();
  });

  it("rejects an answer with no written plan", () => {
    expect(parseGuide('{"overnight":[],"closing":"bye"}')).toBeNull();
  });

  it("drops advice for a stop the plan does not have", async () => {
    const body = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              overnight: [
                { stop_id: "stop-8", where: "Cujmir", why: "ok", check: [] },
                { stop_id: "made-up", where: "none", why: "no", check: [] },
              ],
              intro: "A trip.",
              sections: [],
            }),
          },
        },
      ],
    };
    const guide = await tripGuide(input, {
      config: { url: "https://x.test", key: "k", model: "m" },
      fetchImpl: async () => new Response(JSON.stringify(body)),
    });
    expect(guide?.overnight.map((entry) => entry.stop_id)).toEqual(["stop-8"]);
  });

  it("gives nothing without an AI key", async () => {
    expect(await tripGuide(input, { config: null })).toBeNull();
  });
});
