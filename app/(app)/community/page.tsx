"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect } from "react";
import Link from "next/link";
import { useCommunityStore } from "@/lib/stores/community.store";
import { useUserStore } from "@/lib/stores/user.store";
import { PinDropButton } from "@/components/community/PinDropButton";
import { PinComposer } from "@/components/community/PinComposer";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import { useCommunityPins } from "@/lib/hooks/useCommunityPins";

export default function CommunityPage() {
  const m = useMessages();
  const setPins = useCommunityStore((s) => s.setPins);
  const session = useUserStore((s) => s.session);
  const { data, isLoading, isError, refetch } = useCommunityPins();

  useEffect(() => {
    if (data?.pins) setPins(data.pins);
  }, [data?.pins, setPins]);

  const pins = data?.pins ?? [];
  const serviceAvailable = data?.configured ?? true;

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={m.nav.community}
          subtitle={m.communityPage.msgef654c97bc}
        />

        {!session && serviceAvailable && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">{m.communityPage.msge68451b952}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="waze-btn-primary px-4 py-2 text-xs"
              >{m.login.title}</Link>
              <Link
                href="/register"
                className="waze-btn-secondary px-4 py-2 text-xs"
              >{m.login.register}</Link>
            </div>
          </WazeCard>
        )}

        {!serviceAvailable && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              {m.communityPage.msgc720f23642}
            </p>
          </WazeCard>
        )}

        {isLoading && (
          <p className="mb-4 text-sm text-[var(--waze-text-muted)]">{m.fuelPage.retrying}</p>
        )}

        {isError && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">{m.communityPage.msg1cae47a8f2}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-sm text-[var(--waze-accent-text)] underline"
            >{m.communityPage.msg87b6d05132}</button>
          </WazeCard>
        )}

        {!isLoading && !isError && pins.length === 0 && serviceAvailable && (
          <p className="mb-4 text-sm text-[var(--waze-text-muted)]">{m.communityPage.msg06ad6a89eb}</p>
        )}

        {!isLoading && !isError && <CommunityFeed />}
      </div>

      <PinDropButton mode="list" />
      <PinComposer />
    </div>
  );
}
