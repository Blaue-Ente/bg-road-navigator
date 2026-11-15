import { describe, expect, it, vi } from "vitest";
import {
  maxTrafficDelayMin,
  trafficDelayNearBorder,
} from "@/lib/planner/border-traffic";

describe("border traffic delay", () => {
  it("picks the longest incident delay", () => {
    expect(
      maxTrafficDelayMin([{ delaySeconds: 180 }, { delaySeconds: 720 }, {}])
    ).toBe(12);
    expect(maxTrafficDelayMin([])).toBeNull();
  });

  it("skips the network when TomTom is not configured", async () => {
    const fetchImpl = vi.fn();
    const delay = await trafficDelayNearBorder({
      coords: { lng: 22.9, lat: 42.98 },
      apiKey: "",
      fetchImpl,
    });
    expect(delay).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads the delay near the crossing and does not put the key in the path", async () => {
    const seen: string[] = [];
    const delay = await trafficDelayNearBorder({
      coords: { lng: 26.3, lat: 41.88 },
      apiKey: "tomtom-secret",
      fetchImpl: async (input) => {
        seen.push(String(input));
        return Response.json({
          incidents: [{ delaySeconds: 600 }, { delaySeconds: 120 }],
        });
      },
    });
    expect(delay).toBe(10);
    expect(seen[0]).toContain("bbox=");
    expect(seen[0]).toContain("key=tomtom-secret");
    expect(seen[0]?.split("?")[0]).not.toContain("tomtom-secret");
  });
});
