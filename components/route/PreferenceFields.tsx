"use client";

import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import { useMessages } from "@/components/i18n/LocaleProvider";
import type { TripPreferences } from "@/lib/planner/preferences";

export function PreferenceFields({
  value,
  onChange,
}: {
  value: TripPreferences;
  onChange: (next: TripPreferences) => void;
}) {
  const m = useMessages();
  const patch = (partial: Partial<TripPreferences>) =>
    onChange({ ...value, ...partial });

  const toggleAvoid = (id: string) => {
    if (id === value.preferred_border) return;
    const has = value.avoid_borders.includes(id);
    patch({
      avoid_borders: has
        ? value.avoid_borders.filter((item) => item !== id)
        : [...value.avoid_borders, id].slice(0, 12),
    });
  };

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="text-sm font-medium text-[var(--waze-text)]">
          {m.prefs.fuelStop}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Choice
            name="fuel-stop"
            checked={value.fuel_stop === "on_route"}
            label={m.prefs.onRoute}
            onChange={() => patch({ fuel_stop: "on_route" })}
          />
          <Choice
            name="fuel-stop"
            checked={value.fuel_stop === "detour"}
            label={m.prefs.detour}
            onChange={() => patch({ fuel_stop: "detour" })}
          />
        </div>
        {value.fuel_stop === "detour" && (
          <RangeField
            id="max-detour"
            label={m.prefs.maxDetour}
            min={0}
            max={45}
            step={1}
            value={value.max_detour_min}
            unit={m.prefs.minutes}
            onChange={(next) => patch({ max_detour_min: next })}
          />
        )}
      </fieldset>

      <RangeField
        id="break-every"
        label={m.prefs.breaks}
        min={45}
        max={240}
        step={15}
        value={value.break_every_min}
        unit={m.prefs.minutes}
        onChange={(next) => patch({ break_every_min: next })}
      />

      <Checkbox
        id="with-pet"
        label={m.prefs.pet}
        checked={value.with_pet}
        onChange={(checked) => patch({ with_pet: checked })}
      />
      <Checkbox
        id="avoid-motorways"
        label={m.prefs.noMotorways}
        checked={value.avoid_motorways}
        onChange={(checked) => patch({ avoid_motorways: checked })}
      />
      <Checkbox
        id="avoid-tolls"
        label={m.prefs.noTolls}
        checked={value.avoid_tolls}
        onChange={(checked) => patch({ avoid_tolls: checked })}
      />

      <fieldset>
        <legend className="text-sm font-medium text-[var(--waze-text)]">
          {m.prefs.overnight}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Choice
            name="overnight"
            checked={value.overnight}
            label={m.prefs.overnightYes}
            onChange={() => patch({ overnight: true })}
          />
          <Choice
            name="overnight"
            checked={!value.overnight}
            label={m.prefs.overnightNo}
            onChange={() => patch({ overnight: false })}
          />
        </div>
        {value.overnight && (
          <RangeField
            id="max-hours"
            label={m.prefs.maxHours}
            min={4}
            max={14}
            step={0.5}
            value={value.max_driving_hours}
            unit={m.prefs.hours}
            onChange={(next) => patch({ max_driving_hours: next })}
          />
        )}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-[var(--waze-text)]">
          {m.prefs.pace}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Choice
            name="pace"
            checked={value.pace === "fast"}
            label={m.prefs.fast}
            onChange={() => patch({ pace: "fast" })}
          />
          <Choice
            name="pace"
            checked={value.pace === "scenic"}
            label={m.prefs.scenic}
            onChange={() => patch({ pace: "scenic" })}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="sr-only">{m.prefs.children}</legend>
        <Checkbox
          id="with-children"
          label={m.prefs.childrenOn}
          checked={value.with_children}
          onChange={(checked) =>
            patch({
              with_children: checked,
              children_ages: checked ? value.children_ages : [],
            })
          }
        />
        {value.with_children && (
          <div className="mt-2 space-y-2 pl-1">
            {value.children_ages.map((age, index) => (
              <div key={`child-${index}`} className="flex items-end gap-2">
                <label className="block flex-1 text-sm text-[var(--waze-text)]">
                  {m.prefs.childAge} {index + 1}
                  <input
                    type="number"
                    min={0}
                    max={17}
                    inputMode="numeric"
                    value={age}
                    onChange={(event) => {
                      const next = [...value.children_ages];
                      next[index] = Number(event.target.value);
                      patch({ children_ages: next });
                    }}
                    className="mt-1 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      children_ages: value.children_ages.filter(
                        (_, item) => item !== index
                      ),
                    })
                  }
                  className="waze-btn-secondary mb-0.5 px-3 py-2 text-sm"
                >
                  {m.prefs.removeChild}
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={value.children_ages.length >= 8}
              onClick={() =>
                patch({ children_ages: [...value.children_ages, 6] })
              }
              className="waze-btn-secondary px-3 py-2 text-sm disabled:opacity-50"
            >
              {m.prefs.addChild}
            </button>
            {value.children_ages.length === 0 && (
              <p className="text-xs text-[var(--waze-text-muted)]">
                {m.prefs.childHint}
              </p>
            )}
          </div>
        )}
      </fieldset>

      <label className="block text-sm text-[var(--waze-text)]" htmlFor="drivers">
        {m.prefs.drivers}
        <select
          id="drivers"
          value={value.drivers}
          onChange={(event) => patch({ drivers: Number(event.target.value) })}
          className="mt-1 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2"
        >
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </label>

      <label
        className="block text-sm text-[var(--waze-text)]"
        htmlFor="preferred-border"
      >
        {m.prefs.preferredBorder}
        <select
          id="preferred-border"
          value={value.preferred_border ?? ""}
          onChange={(event) => {
            const next = event.target.value || null;
            patch({
              preferred_border: next,
              avoid_borders: value.avoid_borders.filter((id) => id !== next),
            });
          }}
          className="mt-1 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2"
        >
          <option value="">{m.prefs.noPreferred}</option>
          {BORDER_CROSSINGS.map((border) => (
            <option key={border.id} value={border.id}>
              {border.name_bg}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-[var(--waze-text)]">
          {m.prefs.avoidBorders}
        </legend>
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
          {BORDER_CROSSINGS.map((border) => (
            <Checkbox
              key={border.id}
              id={`avoid-${border.id}`}
              label={border.name_bg}
              checked={value.avoid_borders.includes(border.id)}
              disabled={value.preferred_border === border.id}
              onChange={() => toggleAvoid(border.id)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function Choice({
  name,
  checked,
  label,
  onChange,
}: {
  name: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`waze-chip min-h-11 cursor-pointer text-sm ${checked ? "waze-chip-active" : ""}`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

function Checkbox({
  id,
  label,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 text-sm text-[var(--waze-text)]"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[var(--waze-accent)]"
      />
      {label}
    </label>
  );
}

function RangeField({
  id,
  label,
  min,
  max,
  step,
  value,
  unit,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label htmlFor={id} className="mt-3 block text-sm text-[var(--waze-text)]">
      {label}: {value} {unit}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full"
      />
    </label>
  );
}
