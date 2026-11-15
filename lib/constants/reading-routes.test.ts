import { describe, expect, it } from "vitest";
import { isReadingRoute, READING_ROUTES } from "@/lib/constants/reading-routes";

describe("reading routes", () => {
  it("lists the text-first pages without the map column", () => {
    expect(READING_ROUTES.has("/tips")).toBe(true);
    expect(READING_ROUTES.has("/vignettes")).toBe(true);
    expect(isReadingRoute("/route")).toBe(false);
    expect(isReadingRoute("/borders")).toBe(false);
  });
});