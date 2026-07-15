"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";

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
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
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
        setSession({
          user: { id: `user-${Date.now()}`, email },
          access_token: "demo-token",
          expires_at: Date.now() + 3600000,
        });
        setProfile({
          id: `user-${Date.now()}`,
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
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 text-white">
        <h1 className="mb-2 text-center text-2xl font-bold">Регистрация</h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          Създайте профил за запазване на маршрути
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
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Регистрация..." : "Регистрирай се"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Вече имате акаунт?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300">
            Вход
          </Link>
        </p>
      </div>
    </div>
  );
}
