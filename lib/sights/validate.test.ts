import { describe, expect, it } from "vitest";
import type { AiSight } from "@/lib/ai/sights";
import { parseSights } from "@/lib/ai/sights";
import { placeSights } from "@/lib/sights/validate";

const line: Array<[number, number]> = [
  [10, 50],
  [11, 50],
  [12, 50],
];

function sight(name: string, town: string): AiSight {
  return { name, town, kind: "history", visit_min: 40, why: "w", history: "h", family_friendly: true };
}

describe("placeSights", () => {
  it("drops a place the map does not know and one far from the road", async () => {
    const places: Record<string, { lat: number; lng: number }> = {
      Castle: { lat: 50.05, lng: 11 },
      Faraway: { lat: 52, lng: 11 },
    };
    const out = await placeSights(
      [sight("Castle", "A"), sight("Invented", "B"), sight("Faraway", "C")],
      line,
      143,
      [70],
      async (name) => places[name] ?? null
    );
    expect(out.map((row) => row.name)).toEqual(["Castle"]);
    expect(out[0]!.near_rest_km).toBe(70);
    expect(out[0]!.extra_min).toBeGreaterThan(40);
  });

  it("keeps one of two results at the same spot", async () => {
    const out = await placeSights(
      [sight("A", "x"), sight("B", "x")],
      line,
      143,
      [],
      async () => ({ lat: 50.02, lng: 11 })
    );
    expect(out).toHaveLength(1);
  });
});

describe("parseSights", () => {
  it("reads the model's JSON and tolerates a bad kind", () => {
    const text = '```json\n{"sights":[{"name":"Bran Castle","town":"Bran","kind":"castle","visit_min":60,"why":"x","history":"y","family_friendly":true},{"bad":1}]}\n```';
    const out = parseSights(text);
    expect(out).toHaveLength(1);
    expect(out[0]!.kind).toBe("attraction");
  });

  it("is empty for an answer that is not JSON", () => {
    expect(parseSights("no idea")).toEqual([]);
  });
});
