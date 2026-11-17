import { NextRequest, NextResponse } from "next/server";
import { aiConfig, chatText, openRouterConfig } from "@/lib/ai/provider";
import { stayPrompt } from "@/lib/ai/stay-why";
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

/** Free OpenRouter models worth comparing (from its public catalogue). */
const OPENROUTER_CANDIDATES = [
  "openai/gpt-6-luna-pro",
  "openai/gpt-6-luna",
  "~openai/gpt-luna-latest",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "inclusionai/ling-3.2-flash:free",
  "baidu/ernie-5.5-flash-preview:free",
  "thinkingmachines/inkling-2-small:free",
  "particle-ai/particle-1:free",
  "openrouter/free",
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
  const viaOpenRouter = request.nextUrl.searchParams.get("provider") === "openrouter";
  const config = viaOpenRouter ? openRouterConfig("") : aiConfig();
  if (!config) {
    return NextResponse.json(
      { error: viaOpenRouter ? "OpenRouter key not found" : "AI is not configured" },
      { status: 503 }
    );
  }
  const candidates: readonly string[] = viaOpenRouter ? OPENROUTER_CANDIDATES : CANDIDATES;
  const limit = rateLimit(`ai-bench:${clientIpFromHeaders(request.headers)}`, 3, 10 * 60_000);
  if (!limit.ok) return NextResponse.json({ error: "Try again later" }, { status: 429 });

  const asked = (request.nextUrl.searchParams.get("models") ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => candidates.includes(name));
  const models = asked.length > 0 ? asked : [...candidates];
  const wanted = Number.parseInt(request.nextUrl.searchParams.get("timeout") ?? "", 10);
  const timeoutMs = Number.isFinite(wanted) ? Math.min(25, Math.max(3, wanted)) * 1000 : 9_000;

  // think=off asks reasoning models to answer without thinking first;
  // tokens= sets the answer budget (default 260, as the stay note uses).
  const thinkOff = request.nextUrl.searchParams.get("think") === "off";
  // effort= (OpenRouter only) sets how much a reasoning model may think.
  const effort = request.nextUrl.searchParams.get("effort");
  const effortBody =
    viaOpenRouter && effort && ["none", "minimal", "low", "medium"].includes(effort)
      ? { reasoning: { effort } }
      : null;
  const tokens = Number.parseInt(request.nextUrl.searchParams.get("tokens") ?? "", 10);
  const maxTokens = Number.isFinite(tokens) ? Math.min(1500, Math.max(100, tokens)) : 260;
  const prompt = stayPrompt({ locale: "bg", ...SAMPLE });

  const results = await Promise.all(
    models.map(async (model) => {
      const started = Date.now();
      let error: string | null = null;
      const raw = await chatText(
        { ...prompt, maxTokens, timeoutMs, ...(effortBody
            ? { extraBody: effortBody }
            : thinkOff
            ? {
                extraBody: viaOpenRouter
                  ? { reasoning: { enabled: false } }
                  : { chat_template_kwargs: { enable_thinking: false } },
              }
            : {}),
        },
        { config: { ...config, model }, onError: (message) => (error = message) }
      );
      const text = raw ? raw.replace(/[*_`#]+/g, "").trim().slice(0, 700) : null;
      return { model, ms: Date.now() - started, ok: text !== null, error, text };
    })
  );
  return NextResponse.json({
    provider: viaOpenRouter ? "openrouter" : "nvidia",
    current: viaOpenRouter ? null : config.model,
    thinkOff,
    effort: effortBody ? effort : null,
    maxTokens,
    results,
  });
}
