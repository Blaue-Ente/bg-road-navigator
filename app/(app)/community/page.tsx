"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCommunityStore } from "@/lib/stores/community.store";
import { useUserStore } from "@/lib/stores/user.store";
import { PinDropButton } from "@/components/community/PinDropButton";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PinCategorySelector } from "@/components/community/PinCategorySelector";
import { PageHeader } from "@/components/ui/PageHeader";
import { WazeCard } from "@/components/ui/WazeCard";
import type { CommunityPin } from "@/types/community.types";

const FALLBACK_COORDS = { lng: 23.3219, lat: 42.6977 };

function readDeviceCoords(): Promise<{ lng: number; lat: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(FALLBACK_COORDS);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        }),
      () => resolve(FALLBACK_COORDS),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
    );
  });
}

export default function CommunityPage() {
  const { pins, isDropMode, setDropMode, addPin, setPins } = useCommunityStore();
  const session = useUserStore((s) => s.session);
  const [selectedCategory, setSelectedCategory] =
    useState<CommunityPin["category"]>("border_info");
  const [title, setTitle] = useState("");
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPins = async () => {
      try {
        const response = await fetch("/api/community/pins");
        if (!response.ok) throw new Error("Community load failed");
        const data = (await response.json()) as {
          pins: CommunityPin[];
          configured: boolean;
        };
        if (cancelled) return;
        setPins(data.pins);
        setServiceAvailable(data.configured);
      } catch {
        if (!cancelled) setLoadError("Сигналите не могат да бъдат заредени.");
      }
    };

    void loadPins();
    return () => {
      cancelled = true;
    };
  }, [setPins]);

  const handleSavePin = () => {
    if (!title.trim() || publishing) return;

    const publish = async () => {
      setPublishing(true);
      setLoadError(null);
      try {
        const coords = await readDeviceCoords();
        const response = await fetch("/api/community/pins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: selectedCategory,
            title: title.trim(),
            coords,
            expires_in_hours: 24,
          }),
        });
        if (response.status === 401) {
          setLoadError("Влезте в профила си, за да публикувате сигнал.");
          return;
        }
        if (!response.ok) throw new Error("Community publish failed");

        const { pin } = (await response.json()) as { pin: CommunityPin };
        addPin(pin);
        setTitle("");
        setDropMode(false);
      } catch {
        setLoadError("Сигналът не можа да бъде публикуван.");
      } finally {
        setPublishing(false);
      }
    };

    void publish();
  };

  return (
    <div className="waze-page">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Общност"
          subtitle="Споделете информация за пътя — граници, инциденти, ремонти"
        />

        {!session && (
          <WazeCard className="mb-4">
            <p className="text-sm text-[var(--waze-text-secondary)]">
              Четенето е свободно. За да пуснете сигнал (полиция, катастрофа,
              почивка…), влезте в профила си.
            </p>
            <div className="mt-3 flex gap-2">
              <Link href="/login" className="waze-btn-primary px-4 py-2 text-xs">
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

        {isDropMode && session && (
          <>
            <button
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDropMode(false)}
              aria-label="Затвори"
            />
            <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-[var(--waze-border)] bg-[var(--waze-surface)] p-5 pb-8">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--waze-text-muted)]/40" />
              <h2 className="mb-4 text-lg font-bold text-[var(--waze-text)]">
                Нов маркер
              </h2>
              <p className="mb-3 text-xs text-[var(--waze-text-muted)]">
                Позицията се взима от текущото ви местоположение (или София, ако
                достъпът е отказан). Картовото поставяне идва скоро.
              </p>
              <div className="mb-4">
                <label className="mb-2 block text-xs text-[var(--waze-text-muted)]">
                  Категория
                </label>
                <PinCategorySelector
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-xs text-[var(--waze-text-muted)]">
                  Заглавие
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Какво се случва?"
                  className="w-full rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-3 text-[var(--waze-text)] outline-none focus:border-[var(--waze-accent)]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSavePin}
                  disabled={publishing}
                  className="waze-btn-primary flex-1 py-3 text-sm disabled:opacity-50"
                >
                  {publishing ? "Публикуване..." : "Публикувай"}
                </button>
                <button
                  onClick={() => setDropMode(false)}
                  className="waze-btn-secondary flex-1 py-3 text-sm"
                >
                  Откажи
                </button>
              </div>
            </div>
          </>
        )}

        {loadError && <p className="mb-3 text-sm text-red-400">{loadError}</p>}

        {!serviceAvailable ? (
          <WazeCard className="py-8 text-center text-[var(--waze-text-muted)]">
            Общността ще бъде активна след конфигуриране на Supabase.
          </WazeCard>
        ) : pins.length === 0 ? (
          <WazeCard className="py-8 text-center text-[var(--waze-text-muted)]">
            Няма активни маркери.
          </WazeCard>
        ) : (
          <CommunityFeed />
        )}
        <PinDropButton />
      </div>
    </div>
  );
}
