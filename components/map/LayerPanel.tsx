"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { pickText } from "@/lib/i18n/localized-field";

import { MAP_LAYERS, type LayerKey } from "@/lib/constants/map-layers";
import { useMapStore } from "@/lib/stores/map.store";
import { useMapStyleStore } from "@/lib/stores/map-style.store";
import { MAP_STYLE_CHOICES } from "@/lib/constants/map-style";
import { flowTilesKey } from "@/components/map/TrafficFlowLayer";
import { COMMUNITY_PIN_CATEGORIES, communityPinLabel } from "@/lib/constants/community-pins";
import {
  CONNECTOR_GROUPS,
  FUEL_FILTER_CODES,
  POWER_STEPS_KW,
} from "@/lib/fuel/filters";
import { formatTemplate } from "@/lib/i18n/format-template";

function SubChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-8 rounded-full px-2.5 text-xs ${
        active
          ? "bg-[var(--waze-accent)] text-white"
          : "bg-[var(--waze-surface-elevated)] text-[var(--waze-text)] ring-1 ring-[var(--waze-border)]"
      }`}
    >
      {children}
    </button>
  );
}

function toggled<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

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
  const showOnly = useMapStore((s) => s.showOnly);
  const communityCategories = useMapStore((s) => s.communityCategories);
  const toggleCommunityCategory = useMapStore((s) => s.toggleCommunityCategory);
  const fuelFilter = useMapStore((s) => s.fuelFilter);
  const setFuelFilter = useMapStore((s) => s.setFuelFilter);
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
              <span className="flex-1">{pickText(locale, layer.label)}</span>
              {layers[layer.key as LayerKey] && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    showOnly(layer.key);
                  }}
                  className="rounded-full px-2 py-0.5 text-xs text-[var(--waze-accent-text)] underline"
                >
                  {m.mapControls.onlyThis}
                </button>
              )}
            </label>
            {layer.key === "community" && layers.community && (
              <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                {COMMUNITY_PIN_CATEGORIES.map((category) => (
                  <SubChip
                    key={category.id}
                    active={communityCategories.includes(category.id)}
                    onClick={() => toggleCommunityCategory(category.id)}
                  >
                    {communityPinLabel(category.id, locale)}
                  </SubChip>
                ))}
              </div>
            )}
            {layer.key === "fuel" && layers.fuel && (
              <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                {FUEL_FILTER_CODES.map((code) => (
                  <SubChip
                    key={code}
                    active={fuelFilter.fuels.includes(code)}
                    onClick={() =>
                      setFuelFilter({ ...fuelFilter, fuels: toggled(fuelFilter.fuels, code) })
                    }
                  >
                    {m.fuelFilter.fuel[code]}
                  </SubChip>
                ))}
              </div>
            )}
            {layer.key === "ev" && layers.ev && (
              <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                {POWER_STEPS_KW.map((kw) => (
                  <SubChip
                    key={kw}
                    active={fuelFilter.minKw === kw}
                    onClick={() => setFuelFilter({ ...fuelFilter, minKw: kw })}
                  >
                    {kw === 0
                      ? m.fuelFilter.anyPower
                      : formatTemplate(m.fuelFilter.minPower, { kw: String(kw) })}
                  </SubChip>
                ))}
                {CONNECTOR_GROUPS.map((group) => (
                  <SubChip
                    key={group}
                    active={fuelFilter.connectors.includes(group)}
                    onClick={() =>
                      setFuelFilter({
                        ...fuelFilter,
                        connectors: toggled(fuelFilter.connectors, group),
                      })
                    }
                  >
                    {m.fuelFilter.plug[group]}
                  </SubChip>
                ))}
              </div>
            )}
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