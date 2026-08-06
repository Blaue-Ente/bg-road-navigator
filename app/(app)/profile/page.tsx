"use client";

import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { signOut } from "@/lib/auth/sign-out";

const VEHICLE_LABELS = {
  car: "Автомобил",
  ev: "Електромобил",
  truck: "Камион",
  motorcycle: "Мотоциклет",
} as const;

const FUEL_LABELS = {
  diesel: "Дизел",
  petrol: "Бензин",
  lpg: "Газ",
  electric: "Електричество",
} as const;

export default function ProfilePage() {
  const session = useUserStore((s) => s.session);
  const profile = useUserStore((s) => s.profile);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Профил"
          subtitle="Любими, запазени маршрути и настройки на превозното средство"
        />

        <RequireAuth reason="Влезте, за да видите профила и запазените маршрути.">
          <div className="space-y-4">
            <WazeCard>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--waze-text)]">
                    {profile?.username || session?.user.email}
                  </p>
                  <p className="text-sm text-[var(--waze-text-muted)]">
                    {session?.user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="text-sm text-[var(--waze-text-muted)] hover:text-red-400"
                >
                  Изход
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-[var(--waze-text-muted)]">Транспорт</span>
                  <p className="font-medium">
                    {profile
                      ? VEHICLE_LABELS[profile.vehicle_type]
                      : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--waze-text-muted)]">Гориво</span>
                  <p className="font-medium">
                    {profile ? FUEL_LABELS[profile.fuel_type] : "—"}
                  </p>
                </div>
                {profile?.tank_capacity_liters != null && (
                  <div>
                    <span className="text-[var(--waze-text-muted)]">Резервоар</span>
                    <p className="font-medium">{profile.tank_capacity_liters} л</p>
                  </div>
                )}
                {profile?.ev_range_km != null && (
                  <div>
                    <span className="text-[var(--waze-text-muted)]">Обхват</span>
                    <p className="font-medium">{profile.ev_range_km} км</p>
                  </div>
                )}
              </div>
            </WazeCard>

            <WazeCard>
              <h2 className="mb-2 text-base font-semibold text-[var(--waze-accent)]">
                Запазени маршрути
              </h2>
              <p className="text-sm text-[var(--waze-text-muted)]">
                Още няма запазени маршрути. Планирайте маршрут и го запазете от
                екрана „Маршрут“ (идва във Фаза 1).
              </p>
              <Link
                href="/route"
                className="mt-3 inline-flex waze-btn-secondary px-4 py-2 text-xs"
              >
                Към планиране
              </Link>
            </WazeCard>

            <WazeCard>
              <h2 className="mb-2 text-base font-semibold text-[var(--waze-accent)]">
                Любими места
              </h2>
              <p className="text-sm text-[var(--waze-text-muted)]">
                Любими граници, бензиностанции и места за почивка ще се появят
                тук след следващата фаза.
              </p>
            </WazeCard>
          </div>
        </RequireAuth>
      </div>
    </div>
  );
}
