"use client";

import { LOCALES, LOCALE_NATIVE_NAME, type Locale } from "@/lib/i18n/locale";
import {
  useLocale,
  useMessages,
  useSetLocale,
} from "@/components/i18n/LocaleProvider";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const m = useMessages();

  return (
    <label
      className={`inline-flex min-h-11 items-center gap-2 text-sm text-[var(--waze-text)] ${className}`}
    >
      <span className="sr-only">{m.locale.switch}</span>
      <select
        aria-label={m.locale.switch}
        value={locale}
        onChange={(event) => {
          const next = event.target.value;
          if (LOCALES.includes(next as Locale)) {
            setLocale(next as Locale);
          }
        }}
        className="min-h-11 min-w-[9.5rem] rounded-xl border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] px-3 py-2 text-sm text-[var(--waze-text)]"
      >
        {LOCALES.map((code) => (
          <option key={code} value={code}>
            {LOCALE_NATIVE_NAME[code]}
          </option>
        ))}
      </select>
    </label>
  );
}