"use client";

import { useEffect, useState } from "react";
import {
  LOCALE_NATIVE_NAME,
  localeTag,
  type Locale,
} from "@/lib/i18n/locale";
import { dismissLocaleOffer } from "@/lib/i18n/suggest-locale";
import {
  notifyLocaleOfferChanged,
  readLocaleOfferList,
  subscribeLocaleOffer,
} from "@/lib/i18n/locale-offer-store";
import { useMessages, useSetLocale } from "@/components/i18n/LocaleProvider";

type LocaleOfferPlacement = "app" | "map" | "auth";

export function LocaleOffer({ placement }: { placement: LocaleOfferPlacement }) {
  const m = useMessages();
  const setLocale = useSetLocale();
  const [clientReady, setClientReady] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Client-only offer: keep server/first paint null to match SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-hydration gate
    setClientReady(true);
  }, []);

  useEffect(() => subscribeLocaleOffer(() => setTick((t) => t + 1)), []);

  const offered = clientReady ? readLocaleOfferList() : null;

  if (!offered?.length) return null;

  const shellClass =
    placement === "map"
      ? "pointer-events-auto mt-2 flex min-h-11 max-w-full items-center gap-1 rounded-full border border-[var(--waze-border)] bg-[var(--waze-surface)] px-2 py-1 text-sm shadow-sm"
      : placement === "auth"
        ? "mb-4 flex min-h-11 w-full items-center gap-1 rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-2 py-1 text-sm"
        : "flex min-h-11 w-full items-center gap-1 border-b border-[var(--waze-border)] bg-[var(--waze-surface)] px-2 py-1 text-sm";

  const pickLocale = (next: Locale) => {
    setLocale(next);
    notifyLocaleOfferChanged();
  };

  const keepBulgarian = () => {
    dismissLocaleOffer();
  };

  return (
    <div role="region" className={shellClass} data-locale-offer={placement}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-0.5 gap-y-1">
        {offered.map((code, index) => (
          <span key={`${code}-${tick}`} className="inline-flex items-center">
            {index > 0 ? (
              <span
                className="px-0.5 text-[var(--waze-text-muted)]"
                aria-hidden
              >
                ·
              </span>
            ) : null}
            <button
              type="button"
              lang={localeTag(code)}
              onClick={() => pickLocale(code)}
              className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-[var(--waze-text)] hover:bg-[var(--waze-surface-elevated)] ${
                index === 0 ? "font-semibold" : "font-medium"
              }`}
            >
              {LOCALE_NATIVE_NAME[code]}
            </button>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={keepBulgarian}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg leading-none text-[var(--waze-text-muted)] hover:bg-[var(--waze-surface-elevated)] hover:text-[var(--waze-text)]"
        aria-label={m.localeOffer.keepBulgarian}
      >
        ×
      </button>
    </div>
  );
}