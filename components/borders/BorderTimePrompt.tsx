"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import { getAllEuropeanCrossings } from "@/lib/constants/european-borders";
import type { Measurement } from "@/lib/borders/crossing-watch";
import { formatTemplate } from "@/lib/i18n/format-template";
import { useBorderTimeStore } from "@/lib/stores/border-time.store";
import { useUserStore } from "@/lib/stores/user.store";

type Phase = "ask" | "sending" | "done" | "failed" | "unavailable";

function Card({ pending }: { pending: Measurement }) {
  const m = useMessages();
  const locale = useLocale();
  const session = useUserStore((s) => s.session);
  const clear = useBorderTimeStore((s) => s.clear);
  const [minutes, setMinutes] = useState(Math.min(720, Math.max(1, pending.minutes)));
  const [phase, setPhase] = useState<Phase>("ask");
  const [message, setMessage] = useState<string | null>(null);

  const crossing = getAllEuropeanCrossings().find((row) => row.id === pending.crossingId);
  const name = crossing
    ? borderDisplayName(locale, {
        crossing_id: crossing.id,
        name_bg: crossing.name_bg,
        name_en: crossing.name_en,
        name_i18n: crossing.name_i18n,
      })
    : pending.crossingId;

  const send = async () => {
    setPhase("sending");
    try {
      const response = await fetch("/api/borders/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crossing_id: pending.crossingId,
          minutes,
          source: pending.origin !== "estimate" && minutes === pending.minutes ? "auto" : "manual",
          reliable: pending.reliable,
          from_country: pending.fromCountry,
          to_country: pending.toCountry,
          started_at: new Date(pending.startedAt).toISOString(),
        }),
      });
      if (response.status === 201) {
        setPhase("done");
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 409) {
        // They already shared this one: say so and let the card go.
        setMessage(body?.error ?? null);
        setPhase("done");
      } else if (response.status === 503) {
        setPhase("unavailable");
      } else {
        setPhase("failed");
      }
    } catch {
      setPhase("failed");
    }
  };

  const shell =
    "pointer-events-auto fixed inset-x-3 z-[85] mx-auto w-[min(26rem,calc(100%-1.5rem))] rounded-2xl border border-[var(--waze-border)] bg-[var(--waze-surface)] p-4 text-sm text-[var(--waze-text)] shadow-lg bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]";

  if (phase === "done") {
    return (
      <div role="status" data-border-time-prompt className={shell}>
        <p>{message ?? m.borderTime.thanks}</p>
        <button type="button" onClick={clear} className="waze-btn-secondary mt-3 px-4 py-2 text-xs">
          {m.nav.close}
        </button>
      </div>
    );
  }

  return (
    <div role="dialog" aria-label={m.borderTime.question} data-border-time-prompt className={shell}>
      <p className="font-semibold">{formatTemplate(m.borderTime.title, { name })}</p>
      <p className="mt-1">{m.borderTime.question}</p>
      <p className="mt-1 text-xs text-[var(--waze-text-secondary)]">
        {pending.origin === "estimate"
          ? formatTemplate(m.borderTime.estimated, { minutes: String(pending.minutes) })
          : pending.reliable
            ? formatTemplate(m.borderTime.measured, { minutes: String(pending.minutes) })
            : m.borderTime.unsure}
      </p>
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={m.borderTime.less}
          onClick={() => setMinutes((value) => Math.max(1, value - 5))}
          className="waze-btn-secondary h-10 w-10 text-lg"
        >
          −
        </button>
        <span className="min-w-20 text-center text-xl font-semibold">
          {formatTemplate(m.borderTime.minutes, { minutes: String(minutes) })}
        </span>
        <button
          type="button"
          aria-label={m.borderTime.more}
          onClick={() => setMinutes((value) => Math.min(720, value + 5))}
          className="waze-btn-secondary h-10 w-10 text-lg"
        >
          +
        </button>
      </div>
      {!session ? (
        <p className="mt-3 text-xs">
          <Link href="/login" className="font-medium text-[var(--waze-accent-text)] underline">
            {m.borderTime.signIn}
          </Link>
        </p>
      ) : null}
      {phase === "failed" && (
        <p className="mt-2 text-xs text-[var(--waze-danger)]">{m.borderTime.failed}</p>
      )}
      {phase === "unavailable" && (
        <p className="mt-2 text-xs text-[var(--waze-text-secondary)]">{m.borderTime.unavailable}</p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => void send()}
          disabled={!session || phase === "sending"}
          className="waze-btn-primary flex-1 px-4 py-2 text-xs disabled:opacity-50"
        >
          {m.borderTime.send}
        </button>
        <button type="button" onClick={clear} className="waze-btn-secondary px-4 py-2 text-xs">
          {m.borderTime.later}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[var(--waze-text-muted)]">{m.borderTime.privacy}</p>
    </div>
  );
}

/** Asks the driver to confirm a measured border wait, once a crossing is behind them. */
export function BorderTimePrompt() {
  const pending = useBorderTimeStore((s) => s.pending);
  if (!pending || typeof document === "undefined") return null;
  return createPortal(<Card key={pending.endedAt} pending={pending} />, document.body);
}
