"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { pickText } from "@/lib/i18n/localized-field";

import { MAP_LAYERS, type LayerKey } from "@/lib/constants/map-layers";
import { useMapStore } from "@/lib/stores/map.store";

export function LayerPanel({
  className = "",
  scrollable = false,
}: {
  className?: string;
  scrollable?: boolean;
}) {
  const m = useMessages();
  const locale = useLocale();
  const layers = useMapStore((s) => s.layers);
  const toggleLayer = useMapStore((s) => s.toggleLayer);

  return (
    <section
      data-tap="layers-panel"
      className={`waze-panel p-2 shadow-lg ${
        scrollable
          ? "max-h-full overflow-y-auto overscroll-contain"
          : "max-h-[70vh] overflow-y-auto"
      } ${className}`.trim()}
      aria-label={m.map.msg8da8df78a7}
    >
      <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-secondary)]">
        {m.mapControls.layers}
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
              {pickText(locale, layer.label)}
            </label>
            {layer.key === "speedCameras" && layers.speedCameras && (
              <p className="px-2 pb-1 text-xs leading-snug text-[var(--waze-text-muted)]">
                {m.map.speedCameraLegal}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}