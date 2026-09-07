"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/stores/user.store";
import type { PinComment } from "@/types/community.types";

async function fetchComments(pinId: string): Promise<{
  comments: PinComment[];
  configured: boolean;
}> {
  const response = await fetch(`/api/community/pins/${pinId}/comments`);
  if (!response.ok) throw new Error("comments load failed");
  return response.json();
}

export function CommentThread({ pinId }: { pinId: string }) {
  const session = useUserStore((s) => s.session);
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["pin-comments", pinId],
    queryFn: () => fetchComments(pinId),
  });

  const post = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const response = await fetch(`/api/community/pins/${pinId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (response.status === 401) {
        setError("Влезте, за да коментирате.");
        return;
      }
      if (response.status === 503) {
        setError("Коментарите изискват Supabase.");
        return;
      }
      if (!response.ok) throw new Error("post failed");
      setBody("");
      await queryClient.invalidateQueries({
        queryKey: ["pin-comments", pinId],
      });
    } catch {
      setError("Коментарът не беше записан.");
    } finally {
      setPosting(false);
    }
  };

  if (data && data.configured === false) {
    return (
      <div className="mt-4 waze-panel p-3 text-sm text-[var(--waze-text-muted)]">
        Коментарите ще бъдат активни след конфигуриране на Supabase.
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-3">
      <h3 className="text-sm font-semibold text-[var(--waze-accent)]">
        Коментари
      </h3>

      {isLoading && (
        <p className="text-sm text-[var(--waze-text-muted)]">Зареждане…</p>
      )}
      {isError && (
        <p className="text-sm text-red-400">
          Коментарите не могат да се заредят.
        </p>
      )}

      {(data?.comments ?? []).length === 0 && !isLoading ? (
        <p className="text-sm text-[var(--waze-text-muted)]">
          Все още няма коментари.
        </p>
      ) : (
        <ul className="space-y-2">
          {(data?.comments ?? []).map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl bg-[var(--waze-surface-elevated)] p-3"
            >
              <p className="text-sm text-[var(--waze-text)]">{comment.body}</p>
              <p className="mt-1 text-[10px] text-[var(--waze-text-muted)]">
                {new Date(comment.created_at).toLocaleString("bg-BG")}
              </p>
            </li>
          ))}
        </ul>
      )}

      {session ? (
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full resize-none rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2 text-sm text-[var(--waze-text)]"
            placeholder="Добави коментар…"
            rows={2}
            maxLength={500}
          />
          {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
          <button
            type="button"
            onClick={() => void post()}
            disabled={!body.trim() || posting}
            className="mt-2 waze-btn-primary w-full py-2 text-sm disabled:opacity-50"
          >
            {posting ? "Публикуване…" : "Публикувай"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-[var(--waze-text-muted)]">
          <Link
            href="/login"
            className="text-[var(--waze-accent)] hover:underline"
          >
            Влезте
          </Link>
          , за да коментирате.
        </p>
      )}
    </div>
  );
}
