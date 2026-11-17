import { NextRequest, NextResponse } from "next/server";
import { aiConfig } from "@/lib/ai/provider";
import { stayWhy } from "@/lib/ai/stay-why";
import { clientIpFromHeaders, rateLimit } from "@/lib/server/rate-limit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Models worth comparing for a short Bulgarian note. Anything else is refused. */
const CANDIDATES = [
  "google/gemma-3-12b-it",
  "google/gemma-4-31b-it",
  "google/gemma-3-4b-it",
  "minimaxai/minimax-m3.1-flash",
  "z-ai/glm-5.3-flash",
  "openai/gpt-oss-20b",
  "nvidia/nemotron-3.5-lightning-30b-a3b",
  "meta/muse-glimmer-30b",
  "mistralai/mistral-large-4-1t-a52b",
] as const;

/** A made-up sample, only to compare models: it is never stored or shown to drivers. */
const SAMPLE = {
  place: "Ниш, Сърбия",
  traveler: ["children", "2 adults"],
  stays: [
    { id: "a", name: "Hotel Alpha", rating: 4.5, reviews: 320, rating_icon_url: null, url: null, distance_km: 0.4, address: null },
    { id: "b", name: "Garni Beta", rating: 4.0, reviews: 90, rating_icon_url: null, url: null, distance_km: 2.1, address: null },
  ],
};

/**
 * Times each candidate model on the same short Bulgarian task, with the
 * server's own key. Returns timings and the text (no keys). Temporary: remove
 * once a model is chosen. Limited to a few calls per ten minutes.
 */
export async function GET(request: NextRequest) {
  const config = aiConfig();
  if (!config) return NextResponse.json({ error: "AI is not configured" }, { status: 503 });
  const limit = rateLimit(`ai-bench:${clientIpFromHeaders(request.headers)}`, 3, 10 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Try again later" }, { status: 429 });

  const asked = (request.nextUrl.searchParams.get("models") ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter((name): name is (typeof CANDIDATES)[number] =>
      (CANDIDATES as readonly string[]).includes(name)
    );
  const models = asked.length > 0 ? asked : [...CANDIDATES];

  const results = await Promise.all(
    models.map(async (model) => {
      const started = Date.now();
      let error: string | null = null;
      const text = await stayWhy(
        { locale: "bg", ...SAMPLE },
        { config: { ...config, model }, onError: (message) => (error = message) }
      );
      return { model, ms: Date.now() - started, ok: text !== null, error, text };
    })
  );
  return NextResponse.json({ current: config.model, results });
}
