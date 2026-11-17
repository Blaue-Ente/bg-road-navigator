import { z } from "zod";
import { chatText, type AiConfig } from "@/lib/ai/provider";

const LANGUAGE = {
  bg: "Bulgarian",
  en: "English",
  tr: "Turkish",
  ro: "Romanian",
} as const;

/** Facts the model may use. The client sends them; nothing here is trusted as truth beyond the text. */
export const TripNotesInputSchema = z.object({
  locale: z.enum(["bg", "en", "tr", "ro"]).default("bg"),
  origin: z.string().trim().max(120),
  destination: z.string().trim().max(120),
  distance_km: z.number().finite().min(0).max(20_000),
  duration_min: z.number().finite().min(0).max(30_000),
  border: z
    .object({
      name: z.string().trim().max(120),
      wait_min: z.number().finite().min(0).max(2_000).nullable(),
    })
    .nullable(),
  stops: z
    .array(
      z.object({
        title: z.string().trim().max(120),
        kinds: z.array(z.string().max(20)).max(4),
        km: z.number().finite().min(0).max(20_000),
      })
    )
    .max(24),
  reasons: z
    .array(z.object({ title: z.string().max(160), detail: z.string().max(400) }))
    .max(8),
  weather: z.array(z.string().max(160)).max(6),
  traveler: z.array(z.string().max(40)).max(6),
});

export type TripNotesInput = z.infer<typeof TripNotesInputSchema>;

const SYSTEM = `You write a short, friendly note for a driver planning a road trip in Europe.
Rules: use ONLY the facts in the JSON. Never invent places, prices, ratings, reviews, opening hours or road conditions. If a fact is missing, leave it out. 2 to 4 sentences, plain text, no markdown, no lists. Explain why this route and these stops suit this traveller, and mention one thing to watch. Do not give legal or safety guarantees.`;

export async function tripNotes(
  input: TripNotesInput,
  deps: { config?: AiConfig | null; fetchImpl?: typeof fetch } = {}
): Promise<string | null> {
  const text = await chatText(
    {
      system: `${SYSTEM}\nWrite in ${LANGUAGE[input.locale]}.`,
      user: JSON.stringify(input),
      maxTokens: 300,
    },
    deps
  );
  if (!text) return null;
  // Models sometimes wrap the answer in markdown or quotes.
  return text
    .replace(/[*_`#]+/g, "")
    .replace(/^["“„]+|["”“]+$/g, "")
    .trim()
    .slice(0, 900);
}
