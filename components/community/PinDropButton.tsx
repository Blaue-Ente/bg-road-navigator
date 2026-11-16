"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";
import { useCommunityStore } from "@/lib/stores/community.store";
import { LoaderCircle, Plus, X } from "lucide-react";

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

interface PinDropButtonProps {
  /** map: tap-to-place; list: geolocation (or Sofia fallback). */
  mode?: "map" | "list";
}

export function PinDropButton({ mode = "list" }: PinDropButtonProps) {
  const m = useMessages();
  const session = useUserStore((s) => s.session);
  const isDropMode = useCommunityStore((s) => s.isDropMode);
  const beginDrop = useCommunityStore((s) => s.beginDrop);
  const cancelDrop = useCommunityStore((s) => s.cancelDrop);
  const [locating, setLocating] = useState(false);

  if (!session) {
    return (
      <Link
        href="/login"
        className={`fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] text-[var(--waze-accent-text)] shadow-sm md:bottom-6 ${
          mode === "map"
            ? "max-md:bottom-[calc(13.5rem+env(safe-area-inset-bottom,0px))]"
            : "max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
        }`}
        aria-label={m.community.msgbfa882b71c}
        title={m.community.msg0c0014ddab}
      >
        <Plus className="h-6 w-6" strokeWidth={2} />
      </Link>
    );
  }

  const onClick = async () => {
    if (isDropMode) {
      cancelDrop();
      return;
    }

    if (mode === "map") {
      beginDrop(null);
      return;
    }

    // List page: seed coords from GPS, then open composer.
    setLocating(true);
    try {
      const coords = await readDeviceCoords();
      beginDrop(coords);
    } finally {
      setLocating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={locating}
      className={`fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--waze-accent)] text-white shadow-sm transition active:scale-95 disabled:opacity-60 md:bottom-6 ${
        mode === "map"
          ? "max-md:bottom-[calc(13.5rem+env(safe-area-inset-bottom,0px))]"
          : "max-md:bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]"
      }`}
      aria-label={
        mode === "map" ? m.community.msgc270ea11f7 : m.community.msg22f2bd8dac
      }
      title={
        mode === "map"
          ? m.community.msg96a758bd4b
          : m.community.msg86bf437ca0
      }
    >
      {isDropMode ? (
        <X className="h-6 w-6" strokeWidth={2} />
      ) : locating ? (
        <LoaderCircle className="h-6 w-6 animate-spin" strokeWidth={2} />
      ) : (
        <Plus className="h-6 w-6" strokeWidth={2} />
      )}
    </button>
  );
}
