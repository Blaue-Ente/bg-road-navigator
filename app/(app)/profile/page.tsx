"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user.store";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { FavoritesPanel } from "@/components/profile/FavoritesPanel";
import { SavedRoutesPanel } from "@/components/profile/SavedRoutesPanel";
import { SavedPlacesPanel } from "@/components/profile/SavedPlacesPanel";
import { UserServicesPanel } from "@/components/setup/UserServicesPanel";
import { LocationSettings } from "@/components/location/LocationSettings";
import { useOperatorMode } from "@/lib/hooks/useOperatorMode";
import { productName } from "@/lib/constants/brand";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { signOut } from "@/lib/auth/sign-out";
import { useState } from "react";

export default function ProfilePage() {
  const m = useMessages();
  const locale = useLocale();
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
          title={m.profilePage.msga5d9b9afd3}
          subtitle={m.profilePage.msgb494b3b3d6}
        />

        <LocationSettings />

        <RequireAuth reason={m.profilePage.msg80b1a91f81}>
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
                className="text-sm text-[var(--waze-text-muted)] hover:text-[var(--waze-danger)]"
              >{m.profilePage.msgdb71e56347}</button>
            </div>
          </WazeCard>

          <ProfileEditForm />
          <FavoritesPanel />
          <UserServicesPanel />
          <SavedRoutesPanel />
          <SavedPlacesPanel />

          <p className="pb-2 text-center text-xs text-[var(--waze-text-muted)]">
            <Link
              href="/route"
              className="text-[var(--waze-accent-text)] hover:underline"
            >{m.profilePage.msg47b672a489}</Link>
          </p>
          <p className="pb-6 text-center">
            <button
              type="button"
              onClick={handleBrandTap}
              className="text-[11px] text-[var(--waze-text-muted)]"
            >
              {isOperator ? m.profilePage.msgab940809f0 : productName(locale)}
            </button>
          </p>
        </RequireAuth>
      </div>
    </div>
  );
}
