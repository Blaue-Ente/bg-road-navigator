"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WazeCard } from "@/components/ui/WazeCard";
import { useMessages } from "@/components/i18n/LocaleProvider";
import { readApiError } from "@/lib/client/read-api-error";
import { formatTemplate } from "@/lib/i18n/format-template";
import { useVehicles, VEHICLES_KEY } from "@/lib/hooks/useVehicles";
import { useUserStore } from "@/lib/stores/user.store";
import type {
  ConsumptionCandidate,
  ConsumptionSource,
  UserVehicle,
  VehicleFuel,
  VehicleKind,
} from "@/lib/vehicles/types";

interface Draft {
  id: string | null;
  name: string;
  vehicle_type: VehicleKind;
  fuel_type: VehicleFuel;
  tank: string;
  range: string;
  consumption: string;
  source: ConsumptionSource;
}

const EMPTY: Draft = {
  id: null,
  name: "",
  vehicle_type: "car",
  fuel_type: "diesel",
  tank: "",
  range: "",
  consumption: "",
  source: "manual",
};

function toDraft(vehicle: UserVehicle): Draft {
  return {
    id: vehicle.id,
    name: vehicle.name,
    vehicle_type: vehicle.vehicle_type,
    fuel_type: vehicle.fuel_type,
    tank: vehicle.tank_capacity_liters?.toString() ?? "",
    range: vehicle.ev_range_km?.toString() ?? "",
    consumption: vehicle.consumption_per_100?.toString() ?? "",
    source: vehicle.consumption_source,
  };
}

function number(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

const FIELD =
  "focus-ring min-h-11 w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2 text-sm";

export function GaragePanel() {
  const m = useMessages();
  const queryClient = useQueryClient();
  const { vehicles, configured, isLoading, isError } = useVehicles();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [finding, setFinding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ConsumptionCandidate[]>([]);
  const profile = useUserStore((state) => state.profile);
  const profileCar =
    profile && (profile.car || profile.tank_capacity_liters || profile.ev_range_km)
      ? profile
      : null;

  const importProfileCar = async () => {
    if (!profileCar) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileCar.car?.trim() || m.planning.carDefault,
          vehicle_type: profileCar.vehicle_type,
          fuel_type: profileCar.fuel_type,
          tank_capacity_liters: profileCar.tank_capacity_liters,
          ev_range_km: profileCar.ev_range_km,
        }),
      });
      if (!response.ok) {
        setMessage(await readApiError(response, m.garage.saveFailed));
        return;
      }
      await queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
    } catch {
      setMessage(m.garage.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
  const electric = draft?.fuel_type === "electric";
  const unit = electric ? m.garage.unitKwh : m.garage.unitLiters;

  const find = async () => {
    if (!draft || draft.name.trim().length < 3) return;
    setFinding(true);
    setMessage(null);
    setCandidates([]);
    try {
      const response = await fetch(
        `/api/vehicles/lookup?q=${encodeURIComponent(draft.name.trim())}`
      );
      if (!response.ok) {
        setMessage(m.garage.lookupFailed);
        return;
      }
      const payload = (await response.json()) as {
        candidates: ConsumptionCandidate[];
      };
      if (payload.candidates.length === 0) setMessage(m.garage.noMatch);
      setCandidates(payload.candidates);
    } catch {
      setMessage(m.garage.lookupFailed);
    } finally {
      setFinding(false);
    }
  };

  const use = (candidate: ConsumptionCandidate) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            consumption: String(candidate.highway_per_100),
            fuel_type: candidate.fuel_type,
            vehicle_type: candidate.vehicle_type,
            range:
              candidate.ev_range_km != null
                ? String(candidate.ev_range_km)
                : current.range,
            tank:
              current.tank === "" && candidate.tank_capacity_liters
                ? String(candidate.tank_capacity_liters)
                : current.tank,
            source:
              candidate.source === "estimate" ? "estimate" : "fueleconomy.gov",
          }
        : current
    );
    setCandidates([]);
  };

  const save = async () => {
    if (!draft || !draft.name.trim()) return;
    setBusy(true);
    setMessage(null);
    const body = {
      name: draft.name.trim(),
      vehicle_type: draft.fuel_type === "electric" ? "ev" : draft.vehicle_type,
      fuel_type: draft.fuel_type,
      tank_capacity_liters: electric ? null : number(draft.tank),
      ev_range_km: electric ? (number(draft.range) ?? null) : null,
      consumption_per_100: number(draft.consumption),
      consumption_source: draft.consumption.trim() ? draft.source : "manual",
    };
    try {
      const response = await fetch(
        draft.id ? `/api/vehicles/${draft.id}` : "/api/vehicles",
        {
          method: draft.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        setMessage(await readApiError(response, m.garage.saveFailed));
        return;
      }
      setDraft(null);
      setCandidates([]);
      await refresh();
    } catch {
      setMessage(m.garage.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const activate = async (vehicle: UserVehicle) => {
    setMessage(null);
    const response = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: true }),
    });
    if (!response.ok) {
      setMessage(m.garage.saveFailed);
      return;
    }
    await refresh();
  };

  const remove = async (vehicle: UserVehicle) => {
    if (
      !window.confirm(
        formatTemplate(m.favorites.confirmRemove, { name: vehicle.name })
      )
    ) {
      return;
    }
    setMessage(null);
    const response = await fetch(`/api/vehicles/${vehicle.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setMessage(m.garage.removeFailed);
      return;
    }
    await refresh();
  };

  const sourceLabel = (source: ConsumptionSource) =>
    source === "fueleconomy.gov"
      ? m.garage.sourceKnown
      : source === "estimate"
        ? m.garage.sourceEstimate
        : m.garage.sourceManual;

  return (
    <WazeCard>
      <h2 className="mb-3 text-base font-semibold text-[var(--waze-accent-text)]">
        {m.garage.title}
      </h2>
      {isLoading && (
        <p className="text-sm text-[var(--waze-text-muted)]">{m.favorites.loading}</p>
      )}
      {(isError || !configured) && !isLoading && (
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {m.garage.unavailable} {m.garage.migrationHint}
        </p>
      )}
      {!isLoading && configured && !isError && vehicles.length === 0 && !draft && (
        <p className="text-sm text-[var(--waze-text-secondary)]">{m.garage.empty}</p>
      )}

      {!isLoading &&
        configured &&
        !isError &&
        vehicles.length === 0 &&
        profileCar &&
        !draft && (
          <button
            type="button"
            onClick={() => void importProfileCar()}
            disabled={busy}
            className="waze-btn-secondary mb-2 min-h-11 px-4 py-2 text-sm disabled:opacity-50"
          >
            {formatTemplate(m.garage.importProfile, {
              name: profileCar.car?.trim() || m.planning.carDefault,
            })}
          </button>
        )}

      {vehicles.length > 0 && (
        <ul className="space-y-2">
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="rounded-xl bg-[var(--waze-surface-elevated)] p-3"
            >
              <p className="flex flex-wrap items-center gap-2 font-medium text-[var(--waze-text)]">
                {vehicle.name}
                {vehicle.is_active && (
                  <span className="rounded-full bg-[var(--waze-accent-muted)] px-2 py-0.5 text-xs text-[var(--waze-accent-text)]">
                    {m.garage.active}
                  </span>
                )}
              </p>
              <p className="text-sm text-[var(--waze-text-secondary)]">
                {vehicle.consumption_per_100 != null
                  ? `${vehicle.consumption_per_100} ${
                      vehicle.fuel_type === "electric"
                        ? m.garage.unitKwh
                        : m.garage.unitLiters
                    } · ${sourceLabel(vehicle.consumption_source)}`
                  : m.garage.consumptionHint}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {!vehicle.is_active && (
                  <button
                    type="button"
                    onClick={() => void activate(vehicle)}
                    className="waze-btn-secondary min-h-11 px-3 py-1.5 text-xs"
                  >
                    {m.garage.makeActive}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDraft(toDraft(vehicle));
                    setCandidates([]);
                    setMessage(null);
                  }}
                  className="waze-btn-secondary min-h-11 px-3 py-1.5 text-xs"
                >
                  {m.garage.edit}
                </button>
                <button
                  type="button"
                  onClick={() => void remove(vehicle)}
                  className="waze-btn-secondary min-h-11 px-3 py-1.5 text-xs text-[var(--waze-danger)]"
                >
                  {m.garage.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <form
          className="mt-3 space-y-3 rounded-xl border border-[var(--waze-border)] p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--waze-text-muted)]">{m.garage.name}</span>
            <input
              value={draft.name}
              maxLength={80}
              placeholder={m.garage.namePlaceholder}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              className={FIELD}
            />
          </label>
          <button
            type="button"
            onClick={() => void find()}
            disabled={finding || draft.name.trim().length < 3}
            className="waze-btn-secondary min-h-11 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {finding ? m.garage.finding : m.garage.findConsumption}
          </button>
          {candidates.length > 0 && (
            <div role="status" className="space-y-2 text-sm">
              <p className="text-[var(--waze-text-secondary)]">{m.garage.pickCandidate}</p>
              {candidates.map((candidate) => (
                <div
                  key={candidate.label}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[var(--waze-surface-elevated)] p-2"
                >
                  <span className="min-w-0 text-[var(--waze-text)]">
                    {candidate.label}
                    <span className="block text-xs text-[var(--waze-text-muted)]">
                      {candidate.highway_per_100}{" "}
                      {candidate.fuel_type === "electric"
                        ? m.garage.unitKwh
                        : m.garage.unitLiters}
                      {candidate.source === "estimate"
                        ? ` · ${m.garage.sourceEstimate}`
                        : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => use(candidate)}
                    className="waze-btn-primary min-h-11 shrink-0 px-3 py-1.5 text-xs"
                  >
                    {m.garage.use}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--waze-text-muted)]">{m.kinds.fuel}</span>
              <select
                value={draft.fuel_type}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    fuel_type: event.target.value as VehicleFuel,
                    vehicle_type:
                      event.target.value === "electric" ? "ev" : "car",
                  })
                }
                className={FIELD}
              >
                <option value="diesel">{m.profile.msga5ed481eca}</option>
                <option value="petrol">{m.profile.msg2ef483ab79}</option>
                <option value="lpg">{m.profile.msg5d1111cb05}</option>
                <option value="electric">{m.profile.msg1828d59889}</option>
              </select>
            </label>
            {!electric && (
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.msge25d2d0eed}</span>
                <select
                  value={draft.vehicle_type}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      vehicle_type: event.target.value as VehicleKind,
                    })
                  }
                  className={FIELD}
                >
                  <option value="car">{m.profile.msg3d4632bfd8}</option>
                  <option value="truck">{m.profile.msg44f23e13a1}</option>
                  <option value="motorcycle">{m.profile.msg945b9e0a05}</option>
                </select>
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--waze-text-muted)]">
                {m.garage.consumption} ({unit})
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={1}
                max={80}
                step={0.1}
                value={draft.consumption}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    consumption: event.target.value,
                    source: "manual",
                  })
                }
                className={FIELD}
              />
            </label>
            {electric ? (
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.ev1ceb}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={50}
                  max={2000}
                  value={draft.range}
                  onChange={(event) => setDraft({ ...draft, range: event.target.value })}
                  className={FIELD}
                />
              </label>
            ) : (
              <label className="block text-sm">
                <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.msg16f8357158}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={8}
                  max={1500}
                  value={draft.tank}
                  onChange={(event) => setDraft({ ...draft, tank: event.target.value })}
                  className={FIELD}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-[var(--waze-text-muted)]">
            {m.garage.consumptionHint}
            {draft.consumption.trim() ? ` ${sourceLabel(draft.source)}.` : ""}
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !draft.name.trim()}
              className="waze-btn-primary min-h-11 flex-1 px-3 py-2 text-sm disabled:opacity-50"
            >
              {busy ? m.garage.saving : m.garage.save}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(null);
                setCandidates([]);
                setMessage(null);
              }}
              className="waze-btn-secondary min-h-11 px-4 py-2 text-sm"
            >
              {m.garage.cancel}
            </button>
          </div>
        </form>
      ) : (
        configured &&
        !isError && (
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY);
              setMessage(null);
            }}
            className="waze-btn-secondary mt-3 min-h-11 px-4 py-2 text-sm"
          >
            {m.garage.add}
          </button>
        )
      )}
      {message && (
        <p className="mt-2 text-sm text-[var(--waze-danger)]" role="alert">
          {message}
        </p>
      )}
    </WazeCard>
  );
}
