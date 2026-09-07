"use client";

import { useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";
import type {
  SavedPlaceCategory,
  SavedPlacePayload,
} from "@/types/place.types";

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
          "text-xs font-medium text-[var(--waze-accent)] hover:underline"
        }
        onClick={(e) => e.stopPropagation()}
      >
        ♡ Любимо
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
        setMessage("Влезте отново");
        return;
      }
      if (response.status === 503) {
        setStatus("error");
        setMessage("Нужен е Supabase");
        return;
      }
      if (!response.ok) throw new Error("save failed");
      setStatus("saved");
    } catch {
      setStatus("error");
      setMessage("Грешка");
    }
  };

  return (
    <button
      type="button"
      onClick={(e) => void save(e)}
      disabled={status === "saving" || status === "saved"}
      className={
        className ??
        "text-xs font-medium text-[var(--waze-accent)] disabled:opacity-60"
      }
      title={message ?? undefined}
    >
      {status === "saved"
        ? "✓ Запазено"
        : status === "saving"
          ? "…"
          : status === "error"
            ? (message ?? "Грешка")
            : "♡ Любимо"}
    </button>
  );
}
