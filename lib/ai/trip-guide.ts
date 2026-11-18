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
  /** Driving plus stops, waits and sleep. */
  total_min: z.number().finite().min(0).max(60_000).optional(),
  depart_local: Text(40).optional(),
  arrive_local: Text(40).optional(),
  pace: z.enum(["fast", "scenic"]).optional(),
  /** Minutes of driving between breaks the plan really uses. */
  break_every_min: z.number().finite().min(20).max(600).optional(),
  travelers: z.object({
    adults: z.number().int().min(1).max(8),
    children_ages: z.array(z.number().int().min(0).max(17)).max(8),
    pet: z.boolean(),
    drivers: z.number().int().min(1).max(4),
  }),
  vehicle: Text(60).optional(),
  /** How roomy the car is, from the form. */
  car_comfort: z.enum(["roomy", "standard", "compact"]).optional(),
  /** True when the first leg starts in the evening or at night (18:00-05:59). */
  leaves_at_night: z.boolean().optional(),
  /** Hours of driving after which the plan puts the first overnight stop. */
  max_day_driving_h: z.number().finite().min(0).max(24).optional(),
  /** What the interesting-road request did to the road, when asked for. */
  scenic_route: z
    .object({
      applied: z.boolean(),
      reason: z.enum(["applied", "same", "too_long", "unsupported"]),
      extra_km: z.number().finite().nullable(),
      extra_min: z.number().finite().nullable(),
    })
    .nullable()
    .optional(),
  /** Day length the plan treats as the health limit, 10 h or 8 h with children. */
  day_limit_h: z.number().finite().min(4).max(14).optional(),
  /** Stretches drivers reported as bad road near this route. */
  bad_roads: z
    .array(
      z.object({
        title: Text(120),
        off_route_km: z.number().finite().min(0).max(100),
        /** A stretch: road kilometres where it starts and ends. */
        from_km: z.number().finite().min(0).max(20_000).optional(),
        to_km: z.number().finite().min(0).max(20_000).optional(),
      })
    )
    .max(8)
    .default([]),
  /** Places the driver asked to pass through, in order. */
  via: z.array(Text(120)).max(3).default([]),
  /** Places the driver added to the trip from the checked list. */
  chosen_sights: z
    .array(
      z.object({
        name: Text(120),
        town: Text(120),
        kind: Text(20),
        along_km: z.number().finite().min(0).max(20_000),
        extra_min: z.number().finite().min(0).max(600),
        why: Text(400),
        history: Text(700),
      })
    )
    .max(8)
    .default([]),
  countries: z.array(Text(8)).max(12),
  border: z
    .object({
      name: Text(120),
      wait_min: z.number().finite().min(0).max(2_000).nullable(),
      local_time: Text(40).optional(),
    })
    .nullable()
    .optional(),
  /** What the forecast says along the way, one line per point. */
  weather: z.array(Text(180)).max(10).default([]),
  /** Official vignettes and tolls on the route. */
  vignettes: z.array(Text(120)).max(10).default([]),
  /** Warnings the plan already carries (works, closures, border, weather). */
  warnings: z.array(Text(220)).max(8).default([]),
  /** One entry per driving day, split at the overnight stops. */
  days: z
    .array(
      z.object({
        day: z.number().int().min(1).max(14),
        from_km: z.number().finite().min(0).max(20_000),
        to_km: z.number().finite().min(0).max(20_000),
        ends_local: Text(40),
        ends_at_stop: Text(60).nullable(),
      })
    )
    .max(14)
    .default([]),
  /** A rough estimate of what the trip costs, from the plan's own engine. */
  costs: z
    .object({
      round_trip: z.boolean(),
      trip_days: z.number().int().min(1).max(400),
      total_eur: z.number().finite(),
      total_low: z.number().finite(),
      total_high: z.number().finite(),
      per_person_eur: z.number().finite(),
      /** True when a fee (a Danube bridge) is named but has no amount. */
      incomplete: z.boolean(),
      prices_checked_on: Text(12),
      lines: z
        .array(
          z.object({
            kind: Text(20),
            country: Text(8).nullable(),
            eur: z.number().finite().nullable(),
            detail: z.record(z.string(), z.union([z.number(), z.string(), z.null()])),
          })
        )
        .max(20),
    })
    .nullable()
    .optional(),
  stops: z
    .array(
      z.object({
        id: Text(60),
        kind: Text(60),
        day: z.number().int().min(1).max(14).optional(),
        title: Text(120),
        /** The map place at the stop. For a stop that also has fuel this is a filling station. */
        place: Text(120).nullable(),
        km: z.number().finite().min(0).max(20_000),
        local_time: Text(40),
        detour_km: z.number().finite().nullable(),
        facts: z.array(Text(160)).max(8),
        /** Overnight stops only: where the page asked the town to be looked up. */
        lat: z.number().finite().optional(),
        lng: z.number().finite().optional(),
        /** Filled in by the server for overnight stops. */
        town: Text(120).nullable().optional(),
        /** A hotel the map names near an overnight stop. */
        hotel: Text(120).nullable().optional(),
        hotel_stars: z.number().finite().nullable().optional(),
        /** Fuel stops: the plan's own judgement of the station. */
        verdict: Text(120).nullable().optional(),
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
  title: Text(160).default(""),
  /** A few sentences that say what this trip is. */
  intro: Text(900).default(""),
  /** The written plan: free-flowing paragraphs under short headings. */
  sections: z
    .array(z.object({ heading: Text(100), text: Text(1_800) }))
    .max(12)
    .default([]),
  overnight: z
    .array(
      z.object({
        stop_id: Text(60),
        /** A hotel from the facts, otherwise the town. */
        where: Text(160),
        why: Text(500).default(""),
        check: Lines(5, 160),
      })
    )
    .max(6)
    .default([]),
  closing: Text(400).default(""),
});

export type TripGuide = z.infer<typeof TripGuideSchema>;

const SYSTEM = `You write the trip plan for a family driving across Europe. It will be read on a phone and printed, so write it like a thoughtful friend who planned the trip: warm, concrete, never padded. Reply with ONLY one JSON object, no markdown fences:
{"title":string,"intro":string,"sections":[{"heading":string,"text":string}],"overnight":[{"stop_id":string,"where":string,"why":string,"check":string[]}],"closing":string}

Rules:
- Use ONLY the facts in the user JSON. Never invent a hotel, restaurant, price, rating, review, opening hour or road condition. A town or area named in the facts is fine.
- "title": short, with the route and the date, for example "Berlin to Bugun, 19-20 December".
- "intro": 2 to 4 sentences: distance, driving time, how many days, who is travelling and the one thing that shapes this trip most.
- "sections": 6 to 10 sections of flowing text (2 to 5 sentences each, no bullet lists, no markdown). Cover, in this order where the facts allow: the first day (leaving time, the legs, where the first break falls and why), each further day, the border crossing (the expected wait and what to bring), the weather that matters, fuel (name the planned stations and their prices, say which to prefer or skip using "verdict"), food and breaks (use food_spots with their times when they fit; say why for THIS group: children's ages, a pet, number of adults, how long since the last break), vignettes and tolls, and what to keep an eye on (use "warnings"). Use real times and kilometres from the facts. Name stops by their place and town.
- Break rhythm: if children or a pet travel, say how that changes the stops. Use "break_every_min" as the plan's real interval.
- "costs": when the facts have "costs", include a section about the expected costs (heading like "Expected costs"). Give the total with its range and per person, then the lines in words: fuel with the litres and price, each vignette with the product chosen and why that one suits the trip length (a day pass each way against one for the whole stay), distance tolls, the night(s), meals and coffee. Say these are approximate, from prices read on "prices_checked_on", and that the official shops have the exact price. If "incomplete" is true, say a bridge or ferry fee is not counted. With "round_trip" the way back on the same road is included; otherwise say it is one way. Use only the numbers given.
- "overnight": one entry per stop whose kind includes "overnight" (stop_id copied exactly). The stop's "place" can be a filling station: NEVER present it as where to sleep. "where" is the "hotel" if the facts give one, otherwise the "town" (and say it is the area to look in). "why" is one or two sentences from the facts only (arrival time, how far is left the next day, services nearby, a small detour). "check" lists what to confirm in the listing before booking, shaped by the travellers (parking, a pet policy answer, a family room, early breakfast, self check-in). Do not claim a place is clean, safe or cheap.
- Human load (always): the plan must not push people past what is sensible. Use "car_comfort": in a "compact" car (small, cramped) say plainly that the stops are closer together and the driving day shorter because people tire sooner, and suggest stretching legs at every stop; in a "roomy" car it is easier to rest and sleep on the way. With "drivers" 2 or more, advise swapping at stops (about every 2 to 3 hours), the resting driver really sleeping, and nobody driving tired. With "leaves_at_night" true, say honestly that starting in the evening means the first stretch is overnight driving, that the first long rest falls in the daytime and is for sleeping, and that the trip takes longer overall than a straight run: this is deliberate, not a mistake. Never praise pushing on without sleep.
- "Why this route" section (use a heading like that, place it second to last): explain, from the facts only, why the plan looks the way it does: the places in "via" the driver asked to pass through (say that they shape the road and may make it longer than the direct way), the border crossing chosen and its wait, "scenic_route" when present (say if the road drawn is the scenic one and how much longer it is, or why the fast road was kept: "too_long" means the scenic road would have been over 25% or two hours longer; "unsupported" means the routing engine could not offer one; "same" means the two roads are the same), the rest rhythm, the driving day length and where the nights fall, and what to relax if the driver wants it shorter (fewer via points, leave in the morning, another border). Be honest about trade-offs. 3 to 6 sentences.
- Safety and health (always one short section, heading like "Safety on the road"): the health limit is "day_limit_h" hours on the road in a day (10 h, 8 h with children). Say where in the plan a day comes near it and that the night stop is there to be used, that tired driving is the real risk, and give two or three short practical tips (water, fresh air, swap drivers, a nap of 20 minutes at a stop, no night driving on bad roads). When "countries" include RO or BG, say plainly that roads there can be in poor condition in places (potholes, patched surfaces, narrow village roads, horse carts and poorly lit sections), that drivers should keep to a lower speed and a larger distance, avoid overtaking on blind stretches, and be extra careful at night and in rain or snow. When "bad_roads" is not empty, name those stretches (with "from_km" and "to_km" when given: "from km X to km Y") as reported by other drivers (say "reported by drivers", never as certain). Never frighten; stay calm and practical. The highest priority is arriving healthy.
- Chosen sights: when "chosen_sights" is not empty, add one section (heading like "Places you chose") that tells the driver, in road order, what each place is and why it suits this group, using only the "why" and "history" given and adding no facts. Say how much time they add in all and that hours and prices must be checked before going. Never suggest places that are not in "chosen_sights".
- "closing": one warm sentence to end on.
- If a fact is missing, leave it out. Do not apologise for missing data. No legal or safety guarantees.`;

/** The first JSON object in the model's answer, validated. */
export function parseGuide(text: string): TripGuide | null {
  const cleaned = text.replace(/```(?:json)?/gi, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = TripGuideSchema.safeParse(JSON.parse(cleaned.slice(start, end + 1)));
    if (!parsed.success) return null;
    const guide = parsed.data;
    // An answer with no written plan is no answer.
    return guide.sections.length > 0 || guide.intro ? guide : null;
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
      maxTokens: 4_200,
      timeoutMs: 50_000,
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
