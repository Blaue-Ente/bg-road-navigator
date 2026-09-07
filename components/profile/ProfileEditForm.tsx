"use client";

import { useState } from "react";
import { useUserStore } from "@/lib/stores/user.store";
import type { Profile } from "@/types/profile.types";
import { WazeCard } from "@/components/ui/WazeCard";

const VEHICLE_OPTIONS: Array<[Profile["vehicle_type"], string]> = [
  ["car", "Автомобил"],
  ["ev", "Електромобил"],
  ["truck", "Камион"],
  ["motorcycle", "Мотоциклет"],
];

const FUEL_OPTIONS: Array<[Profile["fuel_type"], string]> = [
  ["diesel", "Дизел"],
  ["petrol", "Бензин"],
  ["lpg", "Газ"],
  ["electric", "Електричество"],
];

export function ProfileEditForm() {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const [username, setUsername] = useState(profile?.username ?? "");
  const [vehicleType, setVehicleType] = useState<Profile["vehicle_type"]>(
    profile?.vehicle_type ?? "car"
  );
  const [fuelType, setFuelType] = useState<Profile["fuel_type"]>(
    profile?.fuel_type ?? "diesel"
  );
  const [tank, setTank] = useState(
    profile?.tank_capacity_liters?.toString() ?? ""
  );
  const [evRange, setEvRange] = useState(
    profile?.ev_range_km?.toString() ?? ""
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <WazeCard>
        <p className="text-sm text-[var(--waze-text-muted)]">
          Профилът още не е зареден. Ако ползвате демо вход без Supabase,
          настройките се пазят само локално след следващия вход със Supabase.
        </p>
      </WazeCard>
    );
  }

  const save = async () => {
    setStatus("saving");
    setError(null);
    try {
      const body = {
        username: username.trim(),
        vehicle_type: vehicleType,
        fuel_type: fuelType,
        tank_capacity_liters:
          tank.trim() === "" ? null : Number.parseFloat(tank),
        ev_range_km:
          evRange.trim() === "" ? null : Number.parseInt(evRange, 10),
      };

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 503) {
        // Demo / no Supabase — update local store only.
        setProfile({
          ...profile,
          username: body.username || profile.username,
          vehicle_type: body.vehicle_type,
          fuel_type: body.fuel_type,
          tank_capacity_liters: body.tank_capacity_liters,
          ev_range_km: body.ev_range_km,
        });
        setStatus("saved");
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "update failed");
      }

      const payload = (await response.json()) as { profile: Profile };
      setProfile(payload.profile);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Грешка при запис");
    }
  };

  return (
    <WazeCard>
      <h2 className="mb-3 text-base font-semibold text-[var(--waze-accent)]">
        Настройки на превозното средство
      </h2>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">
            Потребителско име
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">
            Транспорт
          </span>
          <select
            value={vehicleType}
            onChange={(e) =>
              setVehicleType(e.target.value as Profile["vehicle_type"])
            }
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            {VEHICLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">
            Гориво
          </span>
          <select
            value={fuelType}
            onChange={(e) =>
              setFuelType(e.target.value as Profile["fuel_type"])
            }
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            {FUEL_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--waze-text-muted)]">
              Резервоар (л)
            </span>
            <input
              type="number"
              min={10}
              max={500}
              value={tank}
              onChange={(e) => setTank(e.target.value)}
              className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--waze-text-muted)]">
              EV обхват (км)
            </span>
            <input
              type="number"
              min={50}
              max={2000}
              value={evRange}
              onChange={(e) => setEvRange(e.target.value)}
              className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === "saving"}
          className="waze-btn-primary w-full py-2.5 text-sm disabled:opacity-50"
        >
          {status === "saved"
            ? "✓ Запазено"
            : status === "saving"
              ? "Запис…"
              : "Запази настройки"}
        </button>
      </div>
    </WazeCard>
  );
}
