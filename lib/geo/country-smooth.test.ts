import { describe, expect, it } from "vitest";
import { absorbStrays } from "@/lib/geo/country-smooth";

const km = (n: number, step = 5) => Array.from({ length: n }, (_, i) => i * step);

describe("absorbStrays", () => {
  it("absorbs a short run between two stretches of the same country", () => {
    const labels = ["RO", "RO", "RS", "RS", "RO", "RO"];
    expect(absorbStrays(labels, km(6), 5)).toEqual(["RO", "RO", "RO", "RO", "RO", "RO"]);
  });

  it("keeps a real transit (long, or between different countries)", () => {
    const long = ["RO", ...Array(10).fill("RS"), "RO"];
    expect(absorbStrays(long, km(12), 5)).toEqual(long);
    const transit = ["DE", "DE", "AT", "AT", "IT", "IT"];
    expect(absorbStrays(transit, km(6), 5)).toEqual(transit);
  });

  it("keeps a stray at the ends", () => {
    const ends = ["RS", "RO", "RO"];
    expect(absorbStrays(ends, km(3), 5)).toEqual(ends);
  });
});
