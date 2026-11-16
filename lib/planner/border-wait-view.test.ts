import { describe, expect, it } from "vitest";
import {
  borderWaitClockLines,
  borderWaitView,
  planWaitMinutes,
} from "@/lib/planner/border-wait-view";
import { NAKORDONI_ATTRIBUTION } from "@/lib/planner/wait";
import type { WaitEstimate } from "@/lib/planner/types";

function wait(overrides: Partial<WaitEstimate> = {}): WaitEstimate {
  return {
    source: "current",
    estimate: true,
    minutes: 25,
    metric: "wait_min",
    quality: "high",
    queue_now: 4,
    observed_at: "2026-11-15T08:00:00.000Z",
    age_min: 5,
    age_label: "преди 5 мин",
    label_bg: "Текуща опашка",
    attribution: NAKORDONI_ATTRIBUTION,
    ...overrides,
  };
}

describe("borderWaitView", () => {
  it("keeps the Nakordoni credit on a licensed crossing", () => {
    const view = borderWaitView(wait());
    expect(view.unlicensed).toBe(false);
    expect(view.attribution?.text).toBe("Data by nakordoni.eu");
    expect(view.detail).toBe("Текуща опашка");
    expect(view.trafficDelayMin).toBeNull();
  });

  it("labels an unlicensed crossing as typical wait and drops Nakordoni even if a credit was attached", () => {
    const view = borderWaitView(
      wait({
        source: "local_typical",
        minutes: 18,
        label_bg: "Пунктът е извън лицензираните пазари на Nakordoni.",
        age_label: "няма наблюдение от nakordoni",
        attribution: NAKORDONI_ATTRIBUTION,
        unlicensed_market: true,
        traffic_delay_min: 11.4,
      })
    );
    expect(view.unlicensed).toBe(true);
    expect(view.minutes).toBe(18);
    expect(view.trafficDelayMin).toBe(11);
    expect(view.detail).toBeNull();
    expect(view.ageLabel).toBeNull();
    expect(view.attribution).toBeNull();
  });

  it("keeps the Hárinfó credit and the traffic delay on that source", () => {
    const view = borderWaitView(
      wait({
        source: "hatarinfo",
        minutes: 15,
        label_bg: "Няма чакане над 15 мин за лек автомобил.",
        attribution: {
          text: "Източник: Унгарска полиция (Hárinfó)",
          href: "https://www.police.hu/hu/hirek-es-informaciok/hatarinfo",
          terms: "https://www.police.hu/",
        },
        traffic_delay_min: 6,
      })
    );
    expect(view.unlicensed).toBe(false);
    expect(view.attribution?.text).toBe("Източник: Унгарска полиция (Hárinfó)");
    expect(view.trafficDelayMin).toBe(6);
    expect(view.source).toBe("hatarinfo");
  });

  it("returns null plan wait for unavailable data", () => {
    expect(
      planWaitMinutes(
        wait({
          source: "unavailable",
          minutes: 0,
          metric: "none",
          attribution: null,
        })
      )
    ).toBeNull();
    const clock = borderWaitClockLines(
      wait({
        source: "unavailable",
        minutes: 0,
        metric: "none",
        attribution: null,
      }),
      "bg",
      "nadlac"
    );
    expect(clock.noData).toBe(true);
    expect(clock.arrival).toBeNull();
  });

  it("renders arrival and now lines when they differ", () => {
    const lines = borderWaitClockLines(
      wait({
        minutes: 60,
        now_minutes: 30,
        eta_iso: "2026-11-16T08:00:00.000Z",
      }),
      "bg",
      "kalotina"
    );
    expect(lines.now?.minutes).toBe(30);
    expect(lines.arrival?.minutes).toBe(60);
    expect(lines.arrival?.line).toContain("60");
    expect(lines.now?.line).toContain("30");
  });

  it("hides the now line when it matches arrival", () => {
    const lines = borderWaitClockLines(
      wait({
        minutes: 45,
        now_minutes: null,
        eta_iso: "2026-11-16T08:00:00.000Z",
      }),
      "en",
      "kalotina"
    );
    expect(lines.now).toBeNull();
    expect(lines.arrival?.minutes).toBe(45);
  });

  it("omits a missing traffic delay", () => {
    const view = borderWaitView(
      wait({
        unlicensed_market: true,
        attribution: null,
        traffic_delay_min: null,
      })
    );
    expect(view.trafficDelayMin).toBeNull();
    expect(view.attribution).toBeNull();
  });
});
