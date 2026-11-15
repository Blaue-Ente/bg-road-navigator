import { describe, expect, it } from "vitest";
import { dedupeMvrRows, mvrPoint, MVR_ATTRIBUTION } from "@/lib/hotspots/mvr";

const cherna = [{ date: "2025-04-01", lng: 23.32, lat: 42.7 }];

describe("MVR accident rows", () => {
  it("keeps a later accident and a same-day accident that is not the same place", () => {
    const rows = [
      {
        objectid: 1,
        date: "2025-04-01",
        year: 2025,
        lng: 23.3202,
        lat: 42.7002,
        died: 0,
        injured: 1,
      },
      {
        objectid: 2,
        date: "2025-04-01",
        year: 2025,
        lng: 23.4,
        lat: 42.7,
        died: 1,
        injured: 0,
      },
      {
        objectid: 3,
        date: "2025-06-02",
        year: 2025,
        lng: 23.32,
        lat: 42.7,
        died: 0,
        injured: 2,
      },
    ];
    const kept = dedupeMvrRows(rows, cherna);
    expect(kept.map((row) => row.objectid)).toEqual([2, 3]);
    expect(mvrPoint(kept[0]!)?.kind).toBe("fatal");
    expect(mvrPoint(kept[1]!)?.kind).toBe("slight");
    expect(mvrPoint(kept[1]!)?.source_id).toBe("bg-mvr");
    expect(MVR_ATTRIBUTION).toBe(
      "Данни: МВР — Интерактивна карта на ПТП (mvr.bg)"
    );
  });
});