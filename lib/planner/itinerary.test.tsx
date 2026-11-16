import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { PlanItineraryView } from "@/components/plan/PlanItineraryView";
import type { Hotspot } from "@/lib/hotspots/types";
import { DEFAULT_TRIP_PREFERENCES } from "@/lib/planner/preferences";
import {
  buildItineraryPoints,
  checklistStorageKey,
  defaultIncludedStops,
  formatClockDuration,
  fractionAlongLine,
  whySummary,
} from "@/lib/planner/itinerary";
import type { PlanStop, TripPlannerResult } from "@/lib/planner/types";

describe("fractionAlongLine", () => {
  it("projects a point onto the middle of a two-vertex line", () => {
    const line: Array<[number, number]> = [
      [23, 42],
      [25, 42],
    ];
    expect(fractionAlongLine(line, { lng: 24, lat: 42.2 })).toBeCloseTo(0.5, 2);
  });
});

describe("buildItineraryPoints", () => {
  it("keeps the included stop and the border between the ends", () => {
    const plan = fakePlan();
    const points = buildItineraryPoints({
      plan,
      includedStopIds: new Set(["stop-1"]),
      via: { label: "Ниш", lng: 21.9, lat: 43.3 },
    });
    expect(points.map((point) => point.label)).toEqual([
      "София",
      "Калотина",
      "Гориво",
      "Ниш",
      "Белград",
    ]);
  });

  it("keeps the safety block, the closing line, the hotspot list, and an empty hazard note", () => {
    const plan = fakePlan();
    plan.checklist.safety = [
      {
        id: "bg-belts",
        kind: "law",
        title: "Колани",
        detail: "Колан за всички.",
      },
    ];
    plan.checklist.safety_closing = "Пазете себе си и другите на пътя.";
    plan.attention_segments = [hotspot()];
    plan.road_hazards = [];
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="bg">
        <PlanItineraryView
          plan={plan}
          includedIds={["stop-1"]}
          checks={{}}
          via={null}
        />
      </LocaleProvider>
    );
    expect(html).toContain("Безопасност в България");
    expect(html).toContain("Пазете себе си и другите на пътя.");
    expect(html).toContain("Участък за повишено внимание");
    expect(html).toContain("4 произшествия");
    expect(html).toContain("Обстановка по пътя");
    expect(html).toContain("Няма активни събития от АПИ в момента");
  });

  it("leaves optional sights out of the default selection", () => {
    const included = defaultIncludedStops([
      stop("stop-1", false, 24),
      stop("sight-1", true, 24.4),
    ]);
    expect(included).toEqual({ "stop-1": true, "sight-1": false });
  });
});

describe("formatClockDuration", () => {
  it("keeps minutes so a wait is not rounded away", () => {
    expect(formatClockDuration(1760)).toBe("1 д 5 ч 20 мин");
    expect(formatClockDuration(1785)).toBe("1 д 5 ч 45 мин");
    expect(formatClockDuration(45)).toBe("45 мин");
  });

  it("uses caller-supplied unit labels", () => {
    const trUnits = { day: "g", hour: "sa", min: "dk" };
    expect(formatClockDuration(1546, trUnits)).toBe("1 g 1 sa 46 dk");
  });
});

describe("checklist and why text", () => {
  it("keys checks by the ends and the departure minute", () => {
    const plan = fakePlan();
    expect(checklistStorageKey(plan)).toBe(
      "bg-road-checklist|София|Белград|2026-11-15T08:00"
    );
    expect(whySummary(plan.why_this_route)).toBe("По-кратко чакане.");
  });
});

function fakePlan(): TripPlannerResult {
  return {
    generated_at: "2026-11-15T07:00:00.000Z",
    planner: "deterministic",
    depart_at: "2026-11-15T08:00:00.000Z",
    vehicle: {
      vehicle_type: "car",
      fuel_type: "diesel",
      energy: "fuel",
      capacity: 50,
      consumption_per_100: 6,
      level: 0.8,
      reserve: 0.15,
      from_profile: false,
    },
    route: {
      distance_km: 400,
      duration_min: 300,
      total_min: 330,
      routing_source: "osrm",
      origin: { label: "София", lng: 23.3, lat: 42.7 },
      destination: { label: "Белград", lng: 20.4, lat: 44.8 },
      geometry: {
        type: "LineString",
        coordinates: [
          [23.3, 42.7],
          [22.8, 43.0],
          [21.9, 43.3],
          [20.4, 44.8],
        ],
      },
      border_waypoint: { label: "Калотина", lng: 22.9, lat: 43.0 },
    },
    border: {
      chosen: null,
      alternatives: [],
      note: "",
    },
    stops: [stop("stop-1", false, 22.2)],
    community: { penalty_min: 0, notes: [] },
    tolls: [],
    export: { google_url: null, apple_url: null, waze_url: null, leg_count: 0 },
    warnings: [],
    preferences: DEFAULT_TRIP_PREFERENCES,
    attribution: {
      text: "© OpenStreetMap contributors",
      license: "ODbL",
      href: "https://www.openstreetmap.org/copyright",
    },
    checklist: {
      vignettes: [],
      toll_sections: [],
      documents: [],
      winter: [],
      kit: [],
      safety: [],
      safety_closing: null,
      bg_links: [],
    },
    road_hazards: [],
    road_hazard_attribution: null,
    attention_segments: [],
    attention_attribution: null,
    weather: { segments: [], warnings: [], attribution: "" },
    why_this_route: [
      {
        code: "preference",
        title: "Чакане",
        detail: "По-кратко чакане.",
        delta_min: null,
        delta_km: null,
      },
    ],
    recommended_fuel: null,
    fuel_averages: [],
  };
}

function hotspot(): Hotspot {
  return {
    id: "bg-1",
    country: "BG",
    lng: 23.1,
    lat: 42.8,
    count: 4,
    fatal: 1,
    serious: 1,
    slight: 2,
    severity: 7,
    year_from: 2021,
    year_to: 2025,
    source_id: "bg-cherna",
  };
}

function stop(id: string, optional: boolean, lng: number): PlanStop {
  return {
    id,
    kinds: optional ? ["sight"] : ["fuel"],
    title: optional ? "Гледка" : "Гориво",
    reason: "причина",
    coords: { lng, lat: 43 },
    distance_from_start_km: 80,
    driving_min: 60,
    eta: "2026-11-15T09:00:00.000Z",
    detour_km: 1,
    brand: null,
    place_name: null,
    on_motorway_service: false,
    place_id: "osm-1",
    place_source: "osm",
    price: null,
    advice: null,
    price_band: optional ? null : "grey",
    average_label_bg: optional ? null : "България: няма средна цена",
    price_label_bg: null,
    price_delta_label_bg: null,
    price_source_label_bg: null,
    flags: [],
    optional,
    price_note: null,
    ratings_available: null,
    lodging_note: null,
    stars: null,
  };
}
