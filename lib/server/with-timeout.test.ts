import { describe, expect, it } from "vitest";
import { withTimeout } from "@/lib/server/with-timeout";

const later = <T,>(value: T, ms: number) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

describe("withTimeout", () => {
  it("returns the value when it arrives in time", async () => {
    expect(await withTimeout(later("ok", 5), 200, "late")).toBe("ok");
  });

  it("returns the fallback and says so when the source is too slow", async () => {
    let told = false;
    const result = await withTimeout(later("ok", 200), 10, "fallback", () => {
      told = true;
    });
    expect(result).toBe("fallback");
    expect(told).toBe(true);
  });

  it("returns the fallback when the source fails", async () => {
    expect(await withTimeout(Promise.reject(new Error("x")), 50, "fallback")).toBe("fallback");
  });
});
