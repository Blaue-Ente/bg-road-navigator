import { describe, expect, it } from "vitest";
import {
  buildFavoriteEnvelope,
  readFavoriteEnvelope,
} from "@/lib/planner/favorite-envelope";

describe("favorite plan envelope", () => {
  it("round-trips via, departure and fuel", () => {
    const envelope = buildFavoriteEnvelope(
      {
        via: [{ label: "Ниш", lng: 21.9, lat: 43.3 }],
        depart_at: "2026-11-15T08:00:00.000Z",
        fuel_level: 0.7,
      },
      { planner: "deterministic" }
    );
    expect(readFavoriteEnvelope(envelope)).toEqual({
      inputs: envelope.inputs,
      result: { planner: "deterministic" },
    });
  });

  it("still reads an older plan blob that is the planner result itself", () => {
    const legacy = { planner: "deterministic", stops: [] };
    expect(readFavoriteEnvelope(legacy)).toEqual({
      inputs: null,
      result: legacy,
    });
  });

  it("drops a broken via point", () => {
    const read = readFavoriteEnvelope({
      kind: "bg-road-favorite-v1",
      inputs: { via: [{ label: "", lng: 1, lat: 2 }, { label: "Ниш" }], fuel_level: 4 },
      result: null,
    });
    expect(read.inputs).toEqual({
      via: [],
      depart_at: null,
      fuel_level: 1,
    });
  });
});
