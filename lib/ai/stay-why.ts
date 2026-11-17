import { chatText, type AiConfig } from "@/lib/ai/provider";
import type { TripadvisorStay } from "@/lib/api-clients/tripadvisor";

const LANGUAGE = { bg: "Bulgarian", en: "English", tr: "Turkish", ro: "Romanian" } as const;

const SYSTEM = `You help a driver choose where to sleep on a long road trip.
Use ONLY the facts in the JSON (name, Tripadvisor rating, number of reviews, distance, traveller needs). Never invent amenities, prices, review quotes or availability. 2 or 3 sentences, plain text, no markdown. Say which listing looks best for this traveller and why, name Tripadvisor as the source of the ratings, and remind them to check the current price and reviews before booking.`;

/** The system and user text for the stay note, also used to compare models. */
export function stayPrompt(input: {
  locale: keyof typeof LANGUAGE;
  place: string;
  stays: TripadvisorStay[];
  traveler: string[];
}): { system: string; user: string } {
  return {
    system: `${SYSTEM}\nWrite in ${LANGUAGE[input.locale]}.`,
    user: JSON.stringify({
      place: input.place,
      traveler: input.traveler,
      stays: input.stays.map((stay) => ({
        name: stay.name,
        rating: stay.rating,
        reviews: stay.reviews,
        distance_km: stay.distance_km,
      })),
    }),
  };
}

export async function stayWhy(
  input: {
    locale: keyof typeof LANGUAGE;
    place: string;
    stays: TripadvisorStay[];
    traveler: string[];
  },
  deps: {
    config?: AiConfig | null;
    fetchImpl?: typeof fetch;
    onError?: (message: string) => void;
    /** Longer than the page would wait, to see how slow a model really is. */
    timeoutMs?: number;
  } = {}
): Promise<string | null> {
  if (input.stays.length === 0) return null;
  const text = await chatText(
    {
      system: `${SYSTEM}\nWrite in ${LANGUAGE[input.locale]}.`,
      user: JSON.stringify({
        place: input.place,
        traveler: input.traveler,
        stays: input.stays.map((stay) => ({
          name: stay.name,
          rating: stay.rating,
          reviews: stay.reviews,
          distance_km: stay.distance_km,
        })),
      }),
      maxTokens: 260,
      // An optional note must not hold up the list of places.
      timeoutMs: deps.timeoutMs ?? 9_000,
    },
    deps
  );
  return text ? text.replace(/[*_`#]+/g, "").trim().slice(0, 700) : null;
}
