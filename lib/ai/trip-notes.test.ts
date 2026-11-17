import { describe, expect, it } from "vitest";
import { aiConfig } from "@/lib/ai/provider";
import { TripNotesInputSchema, tripNotes } from "@/lib/ai/trip-notes";

const input = TripNotesInputSchema.parse({
  locale: "en",
  origin: "Berlin",
  destination: "Sofia",
  distance_km: 1637,
  duration_min: 880,
  border: { name: "Kalotina", wait_min: 25 },
  stops: [{ title: "Aral", kinds: ["fuel"], km: 104 }],
  reasons: [],
  weather: [],
  traveler: ["children"],
});

describe("aiConfig", () => {
  it("is off without a key", () => {
    expect(aiConfig({} as NodeJS.ProcessEnv)).toBeNull();
  });
  it("prefers AI_* over NVIDIA_*", () => {
    const config = aiConfig({
      AI_API_KEY: "a",
      AI_MODEL: "m",
      AI_BASE_URL: "https://x/v1/chat/completions",
      NVIDIA_API_KEY: "n",
    } as unknown as NodeJS.ProcessEnv);
    expect(config).toEqual({
      key: "a",
      model: "m",
      url: "https://x/v1/chat/completions",
    });
    expect(
      aiConfig({ NVIDIA_API_KEY: "n" } as unknown as NodeJS.ProcessEnv)?.url
    ).toContain("nvidia.com");
  });
});

describe("tripNotes", () => {
  const config = { url: "https://x", key: "k", model: "m" };
  const reply = (content: string) =>
    (async () =>
      new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status: 200,
      })) as unknown as typeof fetch;

  it("returns cleaned text and sends only the given facts", async () => {
    let body = "";
    const fetchImpl = (async (_: string, init: RequestInit) => {
      body = String(init.body);
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: '**"Good route** for kids."' } }],
        }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;
    const text = await tripNotes(input, { config, fetchImpl });
    expect(text).toBe("Good route for kids.");
    expect(body).toContain("Kalotina");
    expect(body).toContain("Write in English");
  });

  it("is null when the provider fails or is off", async () => {
    const down = (async () =>
      new Response("x", { status: 500 })) as unknown as typeof fetch;
    expect(await tripNotes(input, { config, fetchImpl: down })).toBeNull();
    expect(await tripNotes(input, { config: null })).toBeNull();
    expect(await tripNotes(input, { config, fetchImpl: reply("") })).toBeNull();
  });

  it("rejects an oversized stop list", () => {
    const many = Array.from({ length: 30 }, () => ({ title: "x", kinds: [], km: 1 }));
    expect(TripNotesInputSchema.safeParse({ ...input, stops: many }).success).toBe(false);
  });
});
