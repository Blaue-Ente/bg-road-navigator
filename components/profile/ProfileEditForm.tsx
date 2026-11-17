"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import { useUserStore } from "@/lib/stores/user.store";
import type { Profile } from "@/types/profile.types";
import { WazeCard } from "@/components/ui/WazeCard";

export function ProfileEditForm() {
  const m = useMessages();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const [username, setUsername] = useState(
    profile?.display_name ?? profile?.username ?? ""
  );
  const [homeCity, setHomeCity] = useState(profile?.home_city ?? "");
  const [usualCountry, setUsualCountry] = useState(profile?.usual_country ?? "");
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
