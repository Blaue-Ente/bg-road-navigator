import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LayerPanel } from "@/components/map/LayerPanel";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import {
  DEFAULT_LAYER_VISIBILITY,
  MAP_LAYERS,
} from "@/lib/constants/map-layers";

describe("map layers", () => {
  it("keeps traffic off until the driver enables the layer", () => {
    expect(DEFAULT_LAYER_VISIBILITY.traffic).toBe(false);
    const layer = MAP_LAYERS.find((item) => item.key === "traffic");
    expect(layer?.visible).toBe(false);
  });

  it("offers Повишено внимание and leaves it on", () => {
    const layer = MAP_LAYERS.find((item) => item.key === "hotspots");
    expect(layer).toMatchObject({
      label_bg: "Повишено внимание",
      visible: true,
      toggleable: true,
    });
    expect(DEFAULT_LAYER_VISIBILITY.hotspots).toBe(true);
    const html = renderToStaticMarkup(
      <LocaleProvider initialLocale="bg">
        <LayerPanel />
      </LocaleProvider>
    );
    expect(html).toContain("Повишено внимание");
    expect(html.indexOf("Повишено внимание")).toBeLessThan(
      html.indexOf("Общност")
    );
  });
});
