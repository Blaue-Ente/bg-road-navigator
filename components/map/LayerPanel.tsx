"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { pickText } from "@/lib/i18n/localized-field";

import { MAP_LAYERS, type LayerKey } from "@/lib/constants/map-layers";
import { useMapStore } from "@/lib/stores/map.store";
import { useMapStyleStore } from "@/lib/stores/map-style.store";
import { MAP_STYLE_CHOICES } from "@/lib/constants/map-style";
import { flowTilesKey } from "@/components/map/TrafficFlowLayer";

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
  const styleChoice = useMapStyleStore((s) => s.choice);
  const setStyleChoice = useMapStyleStore((s) => s.setChoice);
  const flowAvailable = flowTilesKey() !== null;

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
        {MAP_LAYERS.filter((layer) => layer.key !== "trafficFlow" || flowAvailable).map((layer) => (
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
      <p className="mt-2 px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-[var(--waze-text-secondary)]">
        {m.mapStyle.title}
      </p>
      <div className="flex flex-wrap gap-1.5 px-2 pb-1" role="radiogroup" aria-label={m.mapStyle.title}>
        {MAP_STYLE_CHOICES.map((choice) => (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={styleChoice === choice}
            onClick={() => setStyleChoice(choice)}
            className={`rounded-full border px-3 py-1 text-xs ${
              styleChoice === choice
                ? "border-[var(--waze-accent)] bg-[var(--waze-accent)] text-white"
                : "border-[var(--waze-border)] text-[var(--waze-text)]"
            }`}
          >
            {m.mapStyle[choice]}
          </button>
        ))}
      </div>
    </section>
  );
}