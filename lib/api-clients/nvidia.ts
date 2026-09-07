/**
 * NVIDIA NIM / OpenAI-compatible chat client for AI trip planning.
 * Returns null when the key is missing or the call fails — callers must
 * fall back to the heuristic planner.
 */

import { z } from "zod";
import type { Route } from "@/types/route.types";
import type {
  TripPlan,
  TripPlanStop,
  TripPlannerPreferences,
} from "@/types/trip.types";

const NVIDIA_CHAT_URL =
  process.env.NVIDIA_API_URL ??
  "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-8b-instruct";
const REQUEST_TIMEOUT_MS = 12_000;

const AiStopSchema = z.object({
  type: z.enum(["fuel", "ev_charge", "rest", "overnight"]),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  distance_from_start_km: z.number().finite().min(0).max(20_000),
  estimated_arrival_min: z.number().finite().min(0).max(30_000),
});

const AiPlanSchema = z.object({
  stops: z.array(AiStopSchema).max(24),
  warnings: z.array(z.string().max(300)).max(12).optional(),
});

function isNvidiaConfigured(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY?.trim());
}

function pointAtKm(
  route: Route,
  targetKm: number
): { lng: number; lat: number } {
  const coordinates = route.geometry.coordinates;
  if (!coordinates.length) return route.destination.coords;

  let travelled = 0;
  const target = Math.min(targetKm, route.distance_km);
  const R = 6371;

  for (let i = 1; i < coordinates.length; i++) {
    const a = {
      lng: coordinates[i - 1]![0],
      lat: coordinates[i - 1]![1],
    };
    const b = {
      lng: coordinates[i]![0],
      lat: coordinates[i]![1],
    };
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const seg = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    if (travelled + seg >= target) {
      const ratio = seg === 0 ? 0 : (target - travelled) / seg;
      return {
        lng: a.lng + (b.lng - a.lng) * ratio,
        lat: a.lat + (b.lat - a.lat) * ratio,
      };
    }
    travelled += seg;
  }

  return route.destination.coords;
}

function buildPrompt(
  route: Route,
  preferences: TripPlannerPreferences
): string {
  return [
    "You are a European road-trip planner for Bulgarian drivers.",
    "Return ONLY valid JSON matching:",
    '{"stops":[{"type":"fuel"|"ev_charge"|"rest"|"overnight","title":string,"description":string,"distance_from_start_km":number,"estimated_arrival_min":number}],"warnings":string[]}',
    "Prefer fewer high-value stops. Titles/descriptions in Bulgarian.",
    `Origin: ${route.origin.label}`,
    `Destination: ${route.destination.label}`,
    `Distance km: ${route.distance_km}`,
    `Duration min: ${route.duration_min}`,
    `Vehicle: ${preferences.vehicle_type}`,
    preferences.fuel_range_km
      ? `Fuel range km: ${preferences.fuel_range_km}`
      : "",
    preferences.ev_range_km ? `EV range km: ${preferences.ev_range_km}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function toTripPlan(
  route: Route,
  preferences: TripPlannerPreferences,
  parsed: z.infer<typeof AiPlanSchema>
): TripPlan {
  const stops: TripPlanStop[] = parsed.stops.map((stop, index) => {
    const distance = Math.min(
      route.distance_km,
      Math.round(stop.distance_from_start_km)
    );
    return {
      id: `ai-${stop.type}-${index}-${distance}`,
      type: stop.type,
      title: stop.title,
      description: stop.description,
      distance_from_start_km: distance,
      estimated_arrival_min: Math.round(stop.estimated_arrival_min),
      coords: pointAtKm(route, distance),
      source: "ai_nvidia",
      requires_confirmation: true,
    };
  });

  return {
    generated_at: new Date().toISOString(),
    planner_source: "nvidia",
    assumptions: {
      driving_break_every_min: preferences.break_every_min ?? 210,
      overnight_after_min: preferences.overnight_after_min ?? 600,
      fuel_range_km:
        preferences.vehicle_type === "ev"
          ? undefined
          : preferences.fuel_range_km,
      ev_range_km:
        preferences.vehicle_type === "ev" ? preferences.ev_range_km : undefined,
    },
    stops: stops.sort(
      (a, b) => a.distance_from_start_km - b.distance_from_start_km
    ),
    warnings: [
      ...(parsed.warnings ?? []),
      "AI план — потвърдете всяка спирка преди пътуването.",
    ],
  };
}

/**
 * Attempt an NVIDIA-backed plan. Returns null if unavailable or invalid.
 */
export async function fetchNvidiaTripPlan(
  route: Route,
  preferences: TripPlannerPreferences
): Promise<TripPlan | null> {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(NVIDIA_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You output strict JSON only. No markdown. No commentary.",
          },
          { role: "user", content: buildPrompt(route, preferences) },
        ],
      }),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart < 0 || jsonEnd < 0) return null;

    const raw = JSON.parse(content.slice(jsonStart, jsonEnd + 1)) as unknown;
    const parsed = AiPlanSchema.safeParse(raw);
    if (!parsed.success) return null;

    return toTripPlan(route, preferences, parsed.data);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export { isNvidiaConfigured };
