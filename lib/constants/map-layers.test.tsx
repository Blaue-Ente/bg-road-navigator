import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayerPanel } from "@/components/map/LayerPanel";
import {
  DEFAULT_LAYER_VISIBILITY,
  MAP_LAYERS,
} from "@/lib/constants/map-layers";

describe("map layers", () => {
  it("offers Повишено внимание and leaves it on", () => {
    const layer = MAP_LAYERS.find((item) => item.key === "hotspots");
    expect(layer).toMatchObject({
      label_bg: "Повишено внимание",
      visible: true,
      toggleable: true,
    });
    expect(DEFAULT_LAYER_VISIBILITY.hotspots).toBe(true);
    const html = renderToStaticMarkup(<LayerPanel />);
    expect(html).toContain("Повишено внимание");
    expect(html.indexOf("Повишено внимание")).toBeLessThan(
      html.indexOf("Общност")
    );
  });
});
