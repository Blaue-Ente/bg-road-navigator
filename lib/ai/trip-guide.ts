import { z } from "zod";
import { chatText, type AiConfig } from "@/lib/ai/provider";

const LANGUAGE = {
  bg: "Bulgarian",
  en: "English",
  tr: "Turkish",
  ro: "Romanian",
} as const;

const Text = (max: number) => z.string().trim().max(max);

/** Facts the model may use, sent by the page from the plan. */
export const TripGuideInputSchema = z.object({
  locale: z.enum(["bg", "en", "tr", "ro"]).default("bg"),
  origin: Text(120),
  destination: Text(120),
  distance_km: z.number().finite().min(0).max(20_000),
  duration_min: z.number().finite().min(0).max(30_000),
  travelers: z.object({
    adults: z.number().int().min(1).max(8),
    children_ages: z.array(z.number().int().min(0).max(17)).max(8),
    pet: z.boolean(),
    drivers: z.number().int().min(1).max(4),
  }),
  vehicle: Text(60).optional(),
  countries: z.array(Text(8)).max(12),
  stops: z
    .array(
      z.object({
        id: Text(60),
        kind: Text(60),
        title: Text(120),
        place: Text(120).nullable(),
        km: z.number().finite().min(0).max(20_000),
        local_time: Text(40),
        detour_km: z.number().finite().nullable(),
        facts: z.array(Text(120)).max(6),
      })
    )
    .max(24),
  food_spots: z
    .array(
      z.object({
        chain: Text(40),
        km: z.number().finite().min(0).max(20_000),
        local_time: Text(40),
        detour_km: z.number().finite().min(0).max(50),
      })
    )
    .max(12),
});

export type TripGuideInput = z.infer<typeof TripGuideInputSchema>;

const Lines = (maxItems: number, maxLen: number) =>
  z.array(Text(maxLen)).max(maxItems).default([]);

export const TripGuideSchema = z.object({
  overnight: z
    .array(
      z.object({
        stop_id: Text(60),
        headline: Text(200),
        reasons: Lines(5, 200),
        check: Lines(5, 160),
      })
    )
    .max(6)
    .default([]),
  meals: z
    .array(z.object({ when: Text(60), where: Text(160), why: Text(240) }))
    .max(8)
    .default([]),
  tips: Lines(5, 220),
});

export type TripGuide = z.infer<typeof TripGuideSchema>;

const SYSTEM = `You are a practical trip assistant for a family driving across Europe. Reply with ONLY one JSON object, no markdown, in this shape:
{"overnight":[{"stop_id":string,"headline":string,"reasons":string[],"check":string[]}],"meals":[{"when":string,"where":string,"why":string}],"tips":string[]}
Rules:
- Use ONLY the facts in the user JSON. Never invent a hotel, restaurant, price, rating, review or opening hour. Naming a town or area from the facts is fine.
- "overnight": one entry per stop whose kind includes "overnight" (stop_id copied exactly). "headline" names the area and what makes it a sensible place to sleep, using only facts (arrival time, small detour, fuel or services nearby, how far is left the next day). "reasons" are claims the facts support. "check" lists what to confirm in the listing before booking, shaped by the travellers (for example: parking, a reply to a pet policy question, a family room, early breakfast, self check-in). Do not claim a place is clean, safe or cheap: those go in "check".
- "meals": proposals for the day, timed from the stops and food_spots. Prefer the chains in food_spots when their time fits lunch or dinner or a children's treat, and say how far off the road they are. Say why it suits THIS group (children's ages, a pet, the number of adults, how long since the last break). Do not invent places that are not in the facts; a break without a food spot can be "pack something from your own supplies".
- "tips": 2 to 4 short, concrete tips for this group and route (pace, break rhythm with children or a dog, crossing the border with children, hydration). No legal or safety guarantees.
- Keep every string short and plain. Write in the language you are told.`;

/** The first JSON object in the model's answer, validated. */
export function parseGuide(text: string): TripGuide | null {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = TripGuideSchema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function tripGuide(
  input: TripGuideInput,
  deps: {
    config?: AiConfig | null;
    fetchImpl?: typeof fetch;
    onError?: (message: string) => void;
  } = {}
): Promise<TripGuide | null> {
  const text = await chatText(
    {
      system: `${SYSTEM}\nWrite in ${LANGUAGE[input.locale]}.`,
      user: JSON.stringify(input),
      maxTokens: 1_400,
      timeoutMs: 28_000,
    },
    deps
  );
  if (!text) return null;
  const guide = parseGuide(text);
  if (!guide) {
    deps.onError?.("the answer was not the expected JSON");
    return null;
  }
  const known = new Set(input.stops.map((stop) => stop.id));
  return {
    ...guide,
    overnight: guide.overnight.filter((entry) => known.has(entry.stop_id)),
  };
}
