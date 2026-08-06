import { describe, expect, it } from "vitest";
import { getAlternativeCrossingIds } from "@/lib/constants/border-alternatives";
import { rankBorderAlternatives } from "@/lib/utils/border-alternatives";
import type { BorderStatus } from "@/types/border.types";

function stubBorder(
  id: string,
  wait: number,
  status: BorderStatus["status"] = "yellow"
): BorderStatus {
  return {
    crossing_id: id,
    name_bg: id,
    name_en: id,
    country_pair: "BG - RO",
    wait_time_cars: wait,
    wait_time_trucks: wait,
    wait_time_buses: wait,
    avg_wait_by_hour: Array(24).fill(wait),
    working_hours: "00:00 - 24:00",
    status,
    last_updated: new Date().toISOString(),
  };
}

describe("border alternatives", () => {
  it("maps Vidin ↔ Ruse", () => {
    expect(getAlternativeCrossingIds("danube-bridge-vidin")).toContain(
      "danube-bridge-ruse"
    );
  });

  it("ranks quieter alternatives as recommended", () => {
    const current = stubBorder("danube-bridge-vidin", 90, "orange");
    const ranked = rankBorderAlternatives(current, [
      current,
      stubBorder("danube-bridge-ruse", 35, "yellow"),
    ]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.crossing.crossing_id).toBe("danube-bridge-ruse");
    expect(ranked[0]!.recommended).toBe(true);
    expect(ranked[0]!.wait_delta_min).toBe(55);
  });
});
