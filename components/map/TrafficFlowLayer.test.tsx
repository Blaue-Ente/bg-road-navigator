import { describe, expect, it } from "vitest";
import { flowTileUrl } from "@/components/map/TrafficFlowLayer";

describe("flowTileUrl", () => {
  it("uses relative0 without thickness, which TomTom refuses with that style", () => {
    const url = flowTileUrl("abc");
    expect(url).toContain("/tile/flow/relative0/{z}/{x}/{y}.png");
    expect(url).toContain("key=abc");
    expect(url).toContain("tileSize=512");
    expect(url).not.toContain("thickness");
  });
});
