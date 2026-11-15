"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";
import type {
  SavedPlaceCategory,
  SavedPlacePayload,
} from "@/types/place.types";
import { Check, Heart } from "lucide-react";

interface FavoritePlaceButtonProps {
  label: string;
  category: SavedPlaceCategory;
  place: SavedPlacePayload;
  className?: string;
}

export function FavoritePlaceButton({
  label,
  category,
  place,
  className,
}: FavoritePlaceButtonProps) {
  const m = useMessages();
  const session = useUserStore((s) => s.session);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  if (!session) {
    return (
      <Link
        href="/login"
        className={
          className ??
          "text-xs font-medium text-[var(--waze-accent-text)] hover:underline"
        }
        onClick={(e) => e.stopPropagation()}
      >
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" strokeWidth={2} />{m.favorites.msg23f59a5c01}</span>
      </Link>
    );
  }

  const save = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (status === "saving" || status === "saved") return;
    setStatus("saving");
    setMessage(null);
    try {
      const response = await fetch("/api/saved-places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, category, place }),
      });
      if (response.status === 401) {
        setStatus("error");
        setMessage(m.favorites.msg633c0751dd);
        return;
      }
      if (response.status === 503) {
        setStatus("error");
        setMessage(m.favorites.msg9eb9539af5);
        return;
      }
      if (!response.ok) throw new Error("save failed");
      setStatus("saved");
    } catch {
      setStatus("error");
      setMessage(m.favorites.msge0baf32095);
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => void save(e)}
      disabled={status === "saving" || status === "saved"}
      className={
        className ??
        "text-xs font-medium text-[var(--waze-accent-text)] disabled:opacity-60"
      }
      title={message ?? undefined}
    >
      {status === "saved" ? (
        <span className="inline-flex items-center gap-1">
          <Check className="h-3.5 w-3.5" strokeWidth={2} />{m.favorites.msg20f68091e2}</span>
      ) : status === "saving" ? (
        m.favorites.msg1f68d7f5be
      ) : status === "error" ? (
        (message ?? m.favorites.msge0baf32095)
      ) : (
        <span className="inline-flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" strokeWidth={2} />{m.favorites.msg23f59a5c01}</span>
      )}
    </button>
  );
}
