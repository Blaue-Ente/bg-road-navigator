import { z } from "zod";
import { chatText, type AiConfig } from "@/lib/ai/provider";
import { SIGHT_KINDS } from "@/lib/sights/types";

const LANGUAGE = {
  bg: "Bulgarian",
  en: "English",
  tr: "Turkish",
  ro: "Romanian",
} as const;

const Text = (max: number) => z.string().trim().max(max);

/** What the model sees: where the road goes and who rides. */
export const SightsInputSchema = z.object({
  locale: z.enum(["bg", "en", "tr", "ro"]).default("bg"),
  origin: Text(120),
  destination: Text(120),
  distance_km: z.number().finite().min(0).max(20_000),
  via: z.array(Text(120)).max(3).default([]),
  children_ages: z.array(z.number().int().min(0).max(17)).max(8).default([]),
  pet: z.boolean().default(false),
  /** Points along the road; the server fills in `town`. */
  along: z
    .array(
      z.object({
        km: z.number().finite().min(0).max(20_000),
        lat: z.number().finite().min(-90).max(90),
        lng: z.number().finite().min(-180).max(180),
        town: Text(120).nullable().optional(),
      })
    )
    .max(10)
    .default([]),
  /** Where the plan already stops to rest, in road kilometres. */
  rest_km: z.array(z.number().finite().min(0).max(20_000)).max(24).default([]),
  /** The road line, thinned, used by the server only. */
  line: z
    .array(z.tuple([z.number().finite(), z.number().finite()]))
    .min(2)
    .max(400),
});

export type SightsInput = z.infer<typeof SightsInputSchema>;

export const AiSightSchema = z.object({
  name: Text(120).min(2),
  town: Text(120).min(2),
  kind: z.enum(SIGHT_KINDS).catch("attraction"),
  visit_min: z.number().finite().min(10).max(300).catch(45),
  why: Text(400).default(""),
  history: Text(700).default(""),
  family_friendly: z.boolean().catch(true),
});

export type AiSight = z.infer<typeof AiSightSchema>;

const SYSTEM = `You suggest places worth a stop on a road trip across Europe, for a family reading on a phone. Reply with ONLY one JSON object, no markdown fences:
{"sights":[{"name":string,"town":string,"kind":"nature"|"architecture"|"history"|"attraction"|"zoo"|"walk"|"festival","visit_min":number,"why":string,"history":string,"family_friendly":boolean}]}

Rules:
- Suggest at most 10 places, spread along the road, from the towns in "along", "via" and the destination. Each place must be a real, widely known sight in or right next to the town you name for it (a castle, old town, cathedral, monastery, fortress, natural park, waterfall, gorge, lake, viewpoint, zoo, museum, a famous walk). If you are not sure a place exists exactly there, leave it out.
- Prefer places within about 15 km of the road. Spread them: no two within 40 km along the road.
- "name": the name people use locally, in the Latin script when the country uses it, so a map can find it (for example "Castelul Bran"), then "town" separately.
- "kind": nature, architecture, history, attraction, zoo, walk or festival. For a festival, only a famous recurring one tied to the town; never give a date.
- "visit_min": a realistic stop of 20 to 120 minutes.
- "why": one or two sentences on why this suits THIS trip. With children, say what they will enjoy; with a pet, whether a walk is easy.
- "history": a short story of the place in 2 to 4 sentences for the printed plan: what it is, who built or founded it and roughly when only if you are certain, and one thing that makes it memorable. Never invent dates, figures, opening hours, ticket prices or event dates. If unsure of a detail, leave it out.
- "family_friendly": true when children and a pet can reasonably go.
- Write the texts in the requested language, keep "name" and "town" as locals write them.`;

export function parseSights(text: string): AiSight[] {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    const raw = JSON.parse(cleaned.slice(start, end + 1)) as { sights?: unknown };
    if (!Array.isArray(raw.sights)) return [];
    const out: AiSight[] = [];
    for (const item of raw.sights.slice(0, 12)) {
      const parsed = AiSightSchema.safeParse(item);
      if (parsed.success) out.push(parsed.data);
    }
    return out;
  } catch {
    return [];
  }
}

export async function suggestSights(
  input: SightsInput,
  deps: {
    config?: AiConfig | null;
    fetchImpl?: typeof fetch;
    onError?: (message: string) => void;
  } = {}
): Promise<AiSight[]> {
  const { line: _line, ...facts } = input;
  void _line;
  const text = await chatText(
    {
      system: `${SYSTEM}\nWrite in ${LANGUAGE[input.locale]}.`,
      user: JSON.stringify(facts),
      maxTokens: 3_000,
      timeoutMs: 30_000,
    },
    deps
  );
  if (!text) return [];
  const sights = parseSights(text);
  if (sights.length === 0) deps.onError?.("the answer had no places");
  return sights;
}
