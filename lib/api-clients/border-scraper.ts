/**
 * Border Wait Time Scraper / Aggregator
 * Fetches border crossing data from public sources
 */

import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import type { BorderStatus } from "@/types/border.types";

const BORDER_API_URL = "https://api.granicata.bg"; // Hypothetical endpoint

export async function fetchBorderStatus(
  crossingId?: string
): Promise<BorderStatus[]> {
  // In a real implementation, this would call actual border APIs
  // For now, we'll return mock data with realistic wait times

  const results: BorderStatus[] = BORDER_CROSSINGS.map((crossing, index) => {
    const now = new Date();
    const hour = now.getHours();
    const waitMinutes = crossing.typical_wait_minutes[hour] ?? 30;
    
    // Simulate some variation
    const actualWait = waitMinutes + (Math.random() * 20 - 10);
    
    let status: "green" | "yellow" | "orange" | "red";
    if (actualWait < 30) status = "green";
    else if (actualWait < 60) status = "yellow";
    else if (actualWait < 120) status = "orange";
    else status = "red";

    return {
      crossing_id: crossing.id,
      name_bg: crossing.name_bg,
      name_en: crossing.name_en,
      country_pair: crossing.country_pair,
      wait_time_cars: Math.round(actualWait),
      wait_time_trucks: Math.round(actualWait * 1.5),
      wait_time_buses: Math.round(actualWait * 1.2),
      avg_wait_by_hour: crossing.typical_wait_minutes,
      working_hours: crossing.working_hours,
      status,
      last_updated: now.toISOString()
    };
  });

  // Filter by specific crossing if requested
  if (crossingId) {
    return results.filter((b) => b.crossing_id === crossingId);
  }

  return results;
}