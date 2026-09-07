"use client";

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
          title="Общност"
          subtitle="Камери, храна, нощувки и пътни сигнали от шофьори"
        />

        {!session && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              Четенето е свободно. За да пуснете сигнал (камера, катастрофа,
              храна, нощувка…), влезте в профила си.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="waze-btn-primary px-4 py-2 text-xs"
              >
                Вход
              </Link>
              <Link
                href="/register"
                className="waze-btn-secondary px-4 py-2 text-xs"
              >
                Регистрация
              </Link>
            </div>
          </WazeCard>
        )}

        {!serviceAvailable && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-muted)]">
              Общността изисква конфигуриран Supabase. Четенето и писането ще се
              активират след миграциите през `008`.
            </p>
          </WazeCard>
        )}

        {isLoading && (
          <p className="mb-4 text-sm text-[var(--waze-text-muted)]">
            Зареждане…
          </p>
        )}

        {isError && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              Сигналите не могат да бъдат заредени.
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-sm text-[var(--waze-accent)] underline"
            >
              Опитай пак
            </button>
          </WazeCard>
        )}

        {!isLoading && !isError && pins.length === 0 && serviceAvailable && (
          <p className="mb-4 text-sm text-[var(--waze-text-muted)]">
            Все още няма активни сигнали в региона.
          </p>
        )}

        {!isLoading && !isError && <CommunityFeed />}
      </div>

      <PinDropButton mode="list" />
      <PinComposer />
    </div>
  );
}
