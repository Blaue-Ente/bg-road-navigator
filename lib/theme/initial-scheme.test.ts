import { describe, expect, it } from "vitest";
import { resolveInitialColorScheme } from "@/lib/theme/initial-scheme";

describe("resolveInitialColorScheme", () => {
  it("honours a stored light choice when the OS prefers dark", () => {
    const stored = JSON.stringify({ state: { scheme: "light" } });
    expect(resolveInitialColorScheme(stored, true)).toBe("light");
  });

  it("uses dark when nothing is stored and the OS prefers dark", () => {
    expect(resolveInitialColorScheme(null, true)).toBe("dark");
  });

  it("defaults to light without storage and without dark preference", () => {
    expect(resolveInitialColorScheme(null, false)).toBe("light");
  });
});