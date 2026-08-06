"use client";

import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { SavedRoutesPanel } from "@/components/profile/SavedRoutesPanel";
import { SavedPlacesPanel } from "@/components/profile/SavedPlacesPanel";
import { signOut } from "@/lib/auth/sign-out";

export default function ProfilePage() {
  const session = useUserStore((s) => s.session);
  const profile = useUserStore((s) => s.profile);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
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
          <SavedRoutesPanel />
          <SavedPlacesPanel />

          <p className="pb-6 text-center text-xs text-[var(--waze-text-muted)]">
            <Link href="/route" className="text-[var(--waze-accent)] hover:underline">
              Планирай нов маршрут
            </Link>
          </p>
        </RequireAuth>
      </div>
    </div>
  );
}
