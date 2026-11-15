"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useMemo, useState } from "react";
import { useUserStore } from "@/lib/stores/user.store";
import type { Profile } from "@/types/profile.types";
import { WazeCard } from "@/components/ui/WazeCard";

export function ProfileEditForm() {
  const m = useMessages();
  const vehicleOptions = useMemo(
    (): Array<[Profile["vehicle_type"], string]> => [
      ["car", m.profile.msg3d4632bfd8],
      ["ev", m.profile.msg16785e68fc],
      ["truck", m.profile.msg44f23e13a1],
      ["motorcycle", m.profile.msg945b9e0a05],
    ],
    [m]
  );
  const fuelOptions = useMemo(
    (): Array<[Profile["fuel_type"], string]> => [
      ["diesel", m.profile.msga5ed481eca],
      ["petrol", m.profile.msg2ef483ab79],
      ["lpg", m.profile.msg5d1111cb05],
      ["electric", m.profile.msg1828d59889],
    ],
    [m]
  );
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const [username, setUsername] = useState(
    profile?.display_name ?? profile?.username ?? ""
  );
  const [homeCity, setHomeCity] = useState(profile?.home_city ?? "");
  const [usualCountry, setUsualCountry] = useState(profile?.usual_country ?? "");
  const [car, setCar] = useState(profile?.car ?? "");
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
          {m.profile.msg52e23bf583}
        </p>
      </WazeCard>
    );
  }

  const save = async () => {
    setStatus("saving");
    setError(null);
    try {
      const body = {
        display_name: username.trim(),
        home_city: homeCity.trim() || null,
        usual_country: usualCountry.trim() || null,
        car: car.trim() || null,
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
        // Database is not ready — keep the edit in the local session only.
        setProfile({
          ...profile,
          username: body.display_name || profile.username,
          display_name: body.display_name || profile.display_name,
          home_city: body.home_city,
          usual_country: body.usual_country,
          car: body.car,
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
      setError(err instanceof Error ? err.message : m.profile.msg7f43c9e9f8);
    }
  };

  return (
    <WazeCard>
      <h2 className="mb-3 text-base font-semibold text-[var(--waze-accent-text)]">{m.profile.msgba3330713a}</h2>
      <div className="space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">{m.auth.msgc1232bca30}</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.msg797e28fd6a}</span>
          <input
            value={homeCity}
            onChange={(e) => setHomeCity(e.target.value)}
            placeholder={m.profile.msgb2a508425c}
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.msgdf9c6d782a}</span>
          <input
            value={usualCountry}
            onChange={(e) => setUsualCountry(e.target.value)}
            placeholder={m.profile.msg542237d7d0}
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.msgd109d9ef8e}</span>
          <input
            value={car}
            onChange={(e) => setCar(e.target.value)}
            placeholder={m.profile.vwPassatc557}
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.msge25d2d0eed}</span>
          <select
            value={vehicleType}
            onChange={(e) =>
              setVehicleType(e.target.value as Profile["vehicle_type"])
            }
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            {vehicleOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--waze-text-muted)]">{m.kinds.fuel}</span>
          <select
            value={fuelType}
            onChange={(e) =>
              setFuelType(e.target.value as Profile["fuel_type"])
            }
            className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            {fuelOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.msg16f8357158}</span>
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
            <span className="mb-1 block text-[var(--waze-text-muted)]">{m.profile.ev1ceb}</span>
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
        {error && <p className="text-sm text-[var(--waze-danger)]">{error}</p>}
        <button
          type="button"
          onClick={() => void save()}
          disabled={status === "saving"}
          className="waze-btn-primary w-full py-2.5 text-sm disabled:opacity-50"
        >
          {status === "saved"
            ? m.favorites.msg20f68091e2
            : status === "saving"
              ? m.planning.savingSettings
              : m.profile.msg2b8508f32b}
        </button>
      </div>
    </WazeCard>
  );
}
