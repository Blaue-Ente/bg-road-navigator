import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { useMapStore } from "@/lib/stores/map.store";

const root = join(import.meta.dirname, "../..");

function readSource(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("map layers panel (mobile stack)", () => {
  it("tracks open state in the map store", () => {
    useMapStore.setState({ layersPanelOpen: false });
    useMapStore.getState().setLayersPanelOpen(true);
    expect(useMapStore.getState().layersPanelOpen).toBe(true);
    useMapStore.getState().setLayersPanelOpen(false);
    expect(useMapStore.getState().layersPanelOpen).toBe(false);
  });

  it("renders the mobile sheet above bottom overlays", () => {
    const controls = readSource("components/map/MapControls.tsx");
    expect(controls).toMatch(/z-\[50\]/);
    expect(controls).toMatch(/layers-panel-mobile/);
    expect(controls).toMatch(/layers-backdrop/);
  });

  it("closes the legend when the layers panel opens", () => {
    const legend = readSource("components/map/MapLegend.tsx");
    expect(legend).toMatch(/layersPanelOpen/);
    expect(legend).toMatch(/setLayersPanelOpen\(false\)/);
  });

  it("hides bottom overlays and FAB while layers are open on mobile", () => {
    const experience = readSource("components/map/MapExperience.tsx");
    const fab = readSource("components/community/PinDropButton.tsx");
    expect(experience).toMatch(/layersPanelOpen[\s\S]*legend-row/);
    expect(fab).toMatch(/layersPanelOpen/);
  });
});