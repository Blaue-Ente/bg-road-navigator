"use client";

import { useState } from "react";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import {
  HU_ROMANIA_PREFERENCE_IDS,
  HUNGARY_SERBIA_PLANNER_IDS,
} from "@/lib/constants/border-official-links";
import { preferenceBorderCrossings } from "@/lib/constants/preference-borders";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import type { Locale } from "@/lib/i18n/locale";
import type { BorderCrossing } from "@/lib/constants/border-crossings";
import { childBreakCapMin, type TripPreferences } from "@/lib/planner/preferences";
import { formatTemplate } from "@/lib/i18n/format-template";

export function PreferenceFields({
  value,
  onChange,
}: {
  value: TripPreferences;
  onChange: (next: TripPreferences) => void;
}) {
  return (
  <div className="space-y-4">
    <TravelerPreferenceFields value={value} onChange={onChange} />
    <SchedulePreferenceFields value={value} onChange={onChange} />
    <RouteStylePreferenceFields value={value} onChange={onChange} />
  </div>
  );
}

/**
 * Age box that can be emptied while typing: a number input bound straight to a
 * number turns an empty box into 0 and typing "9" then shows "09".
 */
function AgeInput({
  age,
  onChange,
}: {
  age: number;
  onChange: (next: number) => void;
}) {
  const [text, setText] = useState(String(age));
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      value={text}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "").slice(0, 2);
        setText(digits);
        if (digits !== "") onChange(Math.min(17, Number(digits)));
      }}
      onBlur={() => {
        if (text === "") {
          setText(String(age));
        } else {
          setText(String(Math.min(17, Number(text))));
        }
      }}
      className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2"
    />
  );
}

export function TravelerPreferenceFields({
  value,
  onChange,
}: {
  value: TripPreferences;
  onChange: (next: TripPreferences) => void;
}) {
  const m = useMessages();
  const patch = (partial: Partial<TripPreferences>) =>
    onChange({ ...value, ...partial });

  return (
    <>
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
              <div key={`child-${index}-of-${value.children_ages.length}`} className="flex items-end gap-2">
                <label className="block flex-1 text-sm text-[var(--waze-text)]">
                  {m.prefs.childAge} {index + 1}
                  <AgeInput
                    age={age}
                    onChange={(next) => {
                      const ages = [...value.children_ages];
                      ages[index] = next;
                      patch({ children_ages: ages });
                    }}
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

      <Checkbox
        id="with-pet"
        label={m.prefs.pet}
        checked={value.with_pet}
        onChange={(checked) => patch({ with_pet: checked })}
      />

      <label className="block text-sm text-[var(--waze-text)]" htmlFor="adults">
        {m.prefs.adults}
        <select
          id="adults"
          value={value.adults}
          onChange={(event) =>
            patch({
              adults: Number(event.target.value),
              drivers: Math.min(value.drivers, Number(event.target.value)),
            })
          }
          className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-[var(--waze-text-muted)]">
          {m.prefs.adultsHint}
        </span>
      </label>

      <label className="block text-sm text-[var(--waze-text)]" htmlFor="drivers">
        {m.prefs.drivers}
        <select
          id="drivers"
          value={value.drivers}
          onChange={(event) => patch({ drivers: Number(event.target.value) })}
          className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2"
        >
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

export function SchedulePreferenceFields({
  value,
  onChange,
}: {
  value: TripPreferences;
  onChange: (next: TripPreferences) => void;
}) {
  const m = useMessages();
  const cap = childBreakCapMin(value);
  const patch = (partial: Partial<TripPreferences>) =>
    onChange({ ...value, ...partial });

  return (
    <>
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
      {cap != null && value.break_every_min > cap && (
        <div className="rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-3 text-sm text-[var(--waze-text)]">
          <p>
            {value.break_exact
              ? m.prefs.breakExactOn
              : formatTemplate(m.prefs.breakCapped, { minutes: String(cap) })}
          </p>
          <div className="mt-2">
            <Checkbox
              id="break-exact"
              label={m.prefs.breakExact}
              checked={value.break_exact}
              onChange={(checked) => patch({ break_exact: checked })}
            />
          </div>
        </div>
      )}
    </>
  );
}

export function RouteStylePreferenceFields({
  value,
  onChange,
}: {
  value: TripPreferences;
  onChange: (next: TripPreferences) => void;
}) {
  const m = useMessages();
  const patch = (partial: Partial<TripPreferences>) =>
    onChange({ ...value, ...partial });

  return (
    <>
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
    </>
  );
}

export function BorderPreferenceFields({
  value,
  onChange,
}: {
  value: TripPreferences;
  onChange: (next: TripPreferences) => void;
}) {
  const m = useMessages();
  const locale = useLocale();
  const patch = (partial: Partial<TripPreferences>) =>
    onChange({ ...value, ...partial });
  const borderOptions = preferenceBorderCrossings();
  const noWaitBorderIds = new Set<string>([
    ...HU_ROMANIA_PREFERENCE_IDS,
    ...HUNGARY_SERBIA_PLANNER_IDS,
  ]);

  const toggleAvoid = (id: string) => {
    if (id === value.preferred_border) return;
    const has = value.avoid_borders.includes(id);
    patch({
      avoid_borders: has
        ? value.avoid_borders.filter((item) => item !== id)
        : [...value.avoid_borders, id].slice(0, 12),
    });
  };

  const avoidOptions = borderOptions.filter(
    (border) => border.id !== value.preferred_border
  );

  return (
    <div className="space-y-4">
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
          className="focus-ring mt-1 min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface)] px-3 py-2"
        >
          <option value="">{m.prefs.noPreferred}</option>
          {borderOptions.map((border) => (
            <option key={border.id} value={border.id}>
              {borderOptionLabel(locale, border, noWaitBorderIds, m.prefs)}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-medium text-[var(--waze-text)]">
          {m.prefs.avoidBorders}
        </legend>
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto pr-1">
          {avoidOptions.map((border) => (
            <Checkbox
              key={border.id}
              id={`avoid-${border.id}`}
              label={borderOptionLabel(locale, border, noWaitBorderIds, m.prefs)}
              checked={value.avoid_borders.includes(border.id)}
              onChange={() => toggleAvoid(border.id)}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
          {m.prefs.bordersHint}
        </p>
      </fieldset>
    </div>
  );
}

function borderOptionLabel(
  locale: Locale,
  border: BorderCrossing,
  noWaitIds: Set<string>,
  prefs: { borderNoWaitData: string }
): string {
  const name = borderDisplayName(locale, border);
  if (!noWaitIds.has(border.id) || border.nakordoni_ppid) return name;
  return `${name} (${prefs.borderNoWaitData})`;
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