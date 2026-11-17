import { z } from "zod";
import type { ConsumptionCandidate } from "@/lib/vehicles/types";

const NVIDIA_CHAT_URL =
  process.env.NVIDIA_API_URL ??
  "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = process.env.NVIDIA_MODEL ?? "meta/llama-3.1-8b-instruct";
const TIMEOUT_MS = 10_000;

const EstimateSchema = z.object({
  fuel_type: z.enum(["diesel", "petrol", "lpg", "electric"]),
  highway_per_100: z.number().finite().min(1.5).max(40),
  tank_capacity_liters: z.number().finite().min(8).max(200).nullable().optional(),
});

export function parseEstimate(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = EstimateSchema.safeParse(JSON.parse(text.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Fallback for European-only models the EPA list does not have. The answer is
 * a typical figure for the model, labelled "estimate" so the driver checks it.
 * Returns null without NVIDIA_API_KEY or on any failure.
 */
export async function estimateConsumption(
  query: string,
  fetchImpl: typeof fetch = fetch
): Promise<ConsumptionCandidate | null> {
  const key = process.env.NVIDIA_API_KEY?.trim();
  if (!key) return null;
  const name = query.trim().slice(0, 80);
  if (!name) return null;
  try {
    const response = await fetchImpl(NVIDIA_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        temperature: 0,
        max_tokens: 120,
        messages: [
          {
            role: "system",
            content:
              'Answer with JSON only: {"fuel_type":"diesel"|"petrol"|"lpg"|"electric","highway_per_100":number,"tank_capacity_liters":number|null}. highway_per_100 is the typical real-world extra-urban consumption at 90-120 km/h in L/100km (kWh/100km for electric). Use the European version of the car.',
          },
          { role: "user", content: name },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const estimate = parseEstimate(payload.choices?.[0]?.message?.content ?? "");
    if (!estimate) return null;
    return {
      label: name,
      year: new Date().getFullYear(),
      highway_per_100: Math.round(estimate.highway_per_100 * 10) / 10,
      combined_per_100: null,
      fuel_type: estimate.fuel_type,
      vehicle_type: estimate.fuel_type === "electric" ? "ev" : "car",
      ev_range_km: null,
      source: "estimate",
      tank_capacity_liters: estimate.tank_capacity_liters ?? null,
    };
  } catch {
    return null;
  }
}
