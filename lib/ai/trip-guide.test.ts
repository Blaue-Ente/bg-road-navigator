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
});

describe("trip guide", () => {
  it("reads the JSON even inside a code fence", () => {
    const guide = parseGuide(
      '```json\n{"overnight":[{"stop_id":"stop-8","headline":"Cujmir","reasons":["a"],"check":["parking"]}],"tips":["pause"]}\n```'
    );
    expect(guide?.overnight[0]?.stop_id).toBe("stop-8");
    expect(guide?.meals).toEqual([]);
    expect(guide?.tips).toEqual(["pause"]);
  });

  it("rejects an answer that is not JSON", () => {
    expect(parseGuide("Sorry, I can't")).toBeNull();
  });

  it("drops advice for a stop the plan does not have", async () => {
    const body = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              overnight: [
                { stop_id: "stop-8", headline: "ok", reasons: [], check: [] },
                { stop_id: "made-up", headline: "no", reasons: [], check: [] },
              ],
              meals: [],
              tips: [],
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
