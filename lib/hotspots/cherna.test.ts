import { describe, expect, it } from "vitest";
import { chernaKind, parseChernaCsv } from "@/lib/hotspots/cherna";

const CSV = [
  "year;date;time;y;x;type;injured;died",
  "2021;1.1.2021;0:15:00;;;БЛЪСКАНЕ;не;не",
  "2021;1.1.2021;2:40:00;42,55073;27,47621;БЛЪСКАНЕ;да;не",
  "2024;13.4.2025;8:00:00;42,70;23,32;БЛЪСКАНЕ;не;да",
  "2023;2.2.2023;1:00:00;;;БЛЪСКАНЕ;да;не",
  "2022;3.3.2022;1:00:00;10,0;10,0;БЛЪСКАНЕ;да;не",
].join("\n");

describe("Cherna Pista rows", () => {
  it("keeps fatal and injury points and drops property damage", () => {
    expect(chernaKind("не", "да")).toBe("fatal");
    expect(chernaKind("да", "не")).toBe("slight");
    expect(chernaKind("не", "не")).toBeNull();

    const parsed = parseChernaCsv(`\uFEFF${CSV}`);
    expect(parsed.rows).toBe(5);
    expect(parsed.datedFrom).toBe("2021-01-01");
    expect(parsed.datedTo).toBe("2025-04-13");
    expect(parsed.points).toEqual([
      {
        lng: 27.47621,
        lat: 42.55073,
        year: 2021,
        kind: "slight",
        country: "BG",
        source_id: "bg-cherna",
      },
      {
        lng: 23.32,
        lat: 42.7,
        year: 2024,
        kind: "fatal",
        country: "BG",
        source_id: "bg-cherna",
      },
    ]);
  });
});
