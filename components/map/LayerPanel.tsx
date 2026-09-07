"use client";

import { MAP_LAYERS, type LayerKey } from "@/lib/constants/map-layers";
import { useMapStore } from "@/lib/stores/map.store";

export function LayerPanel() {
  const layers = useMapStore((s) => s.layers);
  const toggleLayer = useMapStore((s) => s.toggleLayer);

  return (
    <section
      className="waze-panel max-h-64 overflow-y-auto p-2"
      aria-label="Слоеве на картата"
    >
      <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--waze-text-muted)]">
        Слоеве
      </p>
      <ul className="space-y-0.5">
        {MAP_LAYERS.map((layer) => (
          <li key={layer.key}>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)]">
              <input
                type="checkbox"
                className="accent-[var(--waze-accent)]"
                checked={layers[layer.key as LayerKey]}
                onChange={() => toggleLayer(layer.key)}
              />
              {layer.label_bg}
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
