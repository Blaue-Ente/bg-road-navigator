"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setSession = useUserStore((s) => s.setSession);
  const setProfile = useUserStore((s) => s.setProfile);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSupabaseConfigured()) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (authError) {
          setError(authError.message);
          return;
        }
        router.push("/");
        return;
      }

      if (email && password && username) {
        const id = `user-${Date.now()}`;
        setSession({
          user: { id, email },
          access_token: "demo-token",
          expires_at: Date.now() + 3600000,
        });
        setProfile({
          id,
          username,
          avatar_url: null,
          vehicle_type: "car",
          fuel_type: "diesel",
          tank_capacity_liters: null,
          ev_range_km: null,
        });
        router.push("/");
      } else {
        setError("Моля, попълнете всички полета");
      }
    } catch {
      setError("Грешка при регистрация");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--waze-bg)] p-4">
      <div className="waze-panel w-full max-w-md p-6 text-[var(--waze-text)]">
        <h1 className="mb-2 text-center text-2xl font-bold text-[var(--waze-accent)]">
          Регистрация
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--waze-text-muted)]">
          Профилът отключва любими места, запазени маршрути и общностни сигнали
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="username">
              Потребителско име
            </label>
            <input
              id="username"
              type="text"
              required
              className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2 text-[var(--waze-text)] focus:outline-none focus:ring-2 focus:ring-[var(--waze-accent)]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="email">
              Имейл
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2 text-[var(--waze-text)] focus:outline-none focus:ring-2 focus:ring-[var(--waze-accent)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              Парола
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2 text-[var(--waze-text)] focus:outline-none focus:ring-2 focus:ring-[var(--waze-accent)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="waze-btn-primary w-full py-2.5 disabled:opacity-50"
          >
            {loading ? "Регистрация..." : "Регистрирай се"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--waze-text-muted)]">
          Вече имате акаунт?{" "}
          <Link href="/login" className="text-[var(--waze-accent)] hover:underline">
            Вход
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-[var(--waze-text-muted)]">
          <Link href="/" className="hover:text-[var(--waze-text-secondary)]">
            Продължи без регистрация
          </Link>
        </p>
      </div>
    </div>
  );
}
