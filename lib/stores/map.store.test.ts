import { beforeEach, describe, expect, it } from "vitest";
import { useMapStore } from "@/lib/stores/map.store";

describe("map layer sub-options", () => {
  beforeEach(() => {
    useMapStore.setState({ communityCategories: [] });
  });

  it("showOnly turns every other layer off", () => {
    useMapStore.getState().setLayer("fuel", true);
    useMapStore.getState().showOnly("fuel");
    const layers = useMapStore.getState().layers;
    expect(layers.fuel).toBe(true);
    expect(Object.entries(layers).filter(([, on]) => on).map(([key]) => key)).toEqual(["fuel"]);
  });

  it("toggles a community category on and off", () => {
    useMapStore.getState().toggleCommunityCategory("accident");
    expect(useMapStore.getState().communityCategories).toEqual(["accident"]);
    useMapStore.getState().toggleCommunityCategory("accident");
    expect(useMapStore.getState().communityCategories).toEqual([]);
  });
});
