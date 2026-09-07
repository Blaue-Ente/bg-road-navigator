"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { SavedRoutesPanel } from "@/components/profile/SavedRoutesPanel";
import { SavedPlacesPanel } from "@/components/profile/SavedPlacesPanel";
import { UserServicesPanel } from "@/components/setup/UserServicesPanel";
import { useOperatorMode } from "@/lib/hooks/useOperatorMode";
import { signOut } from "@/lib/auth/sign-out";
import { useState } from "react";

export default function ProfilePage() {
  const session = useUserStore((s) => s.session);
  const profile = useUserStore((s) => s.profile);
  const router = useRouter();
  const { enabled: isOperator, enable: enableOperator } = useOperatorMode();
  const [tapCount, setTapCount] = useState(0);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const handleBrandTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 7) enableOperator();
  };

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl space-y-4">
        <PageHeader
          title="Профил"
          subtitle="Любими, запазени маршрути и настройки на превозното средство"
        />

        <RequireAuth reason="Влезте, за да видите профила, любимите и запазените маршрути.">
          <WazeCard>
            <div className="flex items-start justify-between gap-3">
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
          </WazeCard>

          <ProfileEditForm />
          <UserServicesPanel />
          <SavedRoutesPanel />
          <SavedPlacesPanel />

          <p className="pb-2 text-center text-xs text-[var(--waze-text-muted)]">
            <Link
              href="/route"
              className="text-[var(--waze-accent)] hover:underline"
            >
              Планирай нов маршрут
            </Link>
          </p>
          <p className="pb-6 text-center">
            <button
              type="button"
              onClick={handleBrandTap}
              className="text-[11px] text-[var(--waze-text-muted)]"
            >
              {isOperator ? "Операторски режим е активен" : "БГ Навигатор"}
            </button>
          </p>
        </RequireAuth>
      </div>
    </div>
  );
}
