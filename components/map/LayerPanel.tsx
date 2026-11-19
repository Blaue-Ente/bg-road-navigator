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
import { TRAFFIC_GROUPS } from "@/lib/map/traffic-kinds";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

/** One compact option inside a layer, looking like the main rows. */
function SubCheck({
  checked,
  onChange,
  label,
  radio = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  radio?: boolean;
}) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-1 text-xs text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)]">
      <input
        type={radio ? "radio" : "checkbox"}
        className="accent-[var(--waze-accent)]"
        checked={checked}
        onChange={onChange}
      />
      <span className="leading-tight">{label}</span>
    </label>
  );
}

function SubGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pb-2 pl-8 pr-2">{children}</div>;
}

const TRAFFIC_GROUP_LABEL = {
  crashes: "groupCrashes",
  closures: "groupClosures",
  works: "groupWorks",
  slowdowns: "groupSlowdowns",
} as const;

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
  const clearCommunityCategories = useMapStore((s) => s.clearCommunityCategories);
  const trafficGroups = useMapStore((s) => s.trafficGroups);
  const toggleTrafficGroup = useMapStore((s) => s.toggleTrafficGroup);
  const fuelFilter = useMapStore((s) => s.fuelFilter);
  const setFuelFilter = useMapStore((s) => s.setFuelFilter);
  const styleChoice = useMapStyleStore((s) => s.choice);
  const setStyleChoice = useMapStyleStore((s) => s.setChoice);
  const flowAvailable = flowTilesKey() !== null;
  // One layer is open at a time, so the panel stays short.
  const [open, setOpen] = useState<LayerKey | null>(null);
  const hasSub = (key: LayerKey) =>
    key === "traffic" || key === "community" || key === "fuel" || key === "ev";

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
        {MAP_LAYERS.filter((layer) => layer.key !== "trafficFlow" || flowAvailable).map((layer) => {
          const key = layer.key as LayerKey;
          const on = layers[key];
          const expandable = on && hasSub(key);
          const expanded = expandable && open === key;
          return (
            <li key={layer.key}>
              <div className="flex items-center rounded-xl hover:bg-[var(--waze-surface-elevated)]">
                <label className="flex min-h-9 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5 text-sm text-[var(--waze-text)]">
                  <input
                    type="checkbox"
                    className="accent-[var(--waze-accent)]"
                    checked={on}
                    onChange={() => toggleLayer(layer.key)}
                  />
                  <span className="flex-1">{pickText(locale, layer.label)}</span>
                </label>
                {on && (
                  <button
                    type="button"
                    onClick={() => showOnly(layer.key)}
                    className="rounded-full px-2 py-0.5 text-xs text-[var(--waze-accent-text)] underline"
                  >
                    {m.mapControls.onlyThis}
                  </button>
                )}
                {expandable && (
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={m.mapControls.moreOptions}
                    onClick={() => setOpen(expanded ? null : key)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--waze-text-secondary)]"
                  >
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" aria-hidden />
                    ) : (
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    )}
                  </button>
                )}
              </div>
              {expanded && key === "traffic" && (
                <SubGrid>
                  {TRAFFIC_GROUPS.map((group) => (
                    <SubCheck
                      key={group}
                      checked={trafficGroups[group]}
                      onChange={() => toggleTrafficGroup(group)}
                      label={m.trafficKind[TRAFFIC_GROUP_LABEL[group]]}
                    />
                  ))}
                </SubGrid>
              )}
              {expanded && key === "community" && (
                <SubGrid>
                  <SubCheck
                    checked={communityCategories.length === 0}
                    onChange={clearCommunityCategories}
                    label={m.mapControls.allKinds}
                  />
                  {COMMUNITY_PIN_CATEGORIES.map((category) => (
                    <SubCheck
                      key={category.id}
                      checked={communityCategories.includes(category.id)}
                      onChange={() => toggleCommunityCategory(category.id)}
                      label={communityPinLabel(category.id, locale)}
                    />
                  ))}
                </SubGrid>
              )}
              {expanded && key === "fuel" && (
                <SubGrid>
                  <SubCheck
                    checked={fuelFilter.fuels.length === 0}
                    onChange={() => setFuelFilter({ ...fuelFilter, fuels: [] })}
                    label={m.mapControls.allKinds}
                  />
                  {FUEL_FILTER_CODES.map((code) => (
                    <SubCheck
                      key={code}
                      checked={fuelFilter.fuels.includes(code)}
                      onChange={() =>
                        setFuelFilter({ ...fuelFilter, fuels: toggled(fuelFilter.fuels, code) })
                      }
                      label={m.fuelFilter.fuel[code]}
                    />
                  ))}
                </SubGrid>
              )}
              {expanded && key === "ev" && (
                <>
                  <SubGrid>
                    {POWER_STEPS_KW.map((kw) => (
                      <SubCheck
                        key={kw}
                        radio
                        checked={fuelFilter.minKw === kw}
                        onChange={() => setFuelFilter({ ...fuelFilter, minKw: kw })}
                        label={
                          kw === 0
                            ? m.fuelFilter.anyPower
                            : formatTemplate(m.fuelFilter.minPower, { kw: String(kw) })
                        }
                      />
                    ))}
                  </SubGrid>
                  <SubGrid>
                    {CONNECTOR_GROUPS.map((group) => (
                      <SubCheck
                        key={group}
                        checked={fuelFilter.connectors.includes(group)}
                        onChange={() =>
                          setFuelFilter({
                            ...fuelFilter,
                            connectors: toggled(fuelFilter.connectors, group),
                          })
                        }
                        label={m.fuelFilter.plug[group]}
                      />
                    ))}
                  </SubGrid>
                </>
              )}
              {key === "speedCameras" && on && (
                <p className="px-2 pb-1 text-xs leading-snug text-[var(--waze-text-muted)]">
                  {m.map.speedCameraLegal}
                </p>
              )}
            </li>
          );
        })}
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