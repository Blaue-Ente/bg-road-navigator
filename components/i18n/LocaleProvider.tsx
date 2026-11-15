"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MessageCatalog } from "@/lib/i18n/locales/bg";
import {
  catalog,
  LOCALE_STORAGE_KEY,
  parseLocale,
  writeLocaleCookie,
  type Locale,
} from "@/lib/i18n/locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: MessageCatalog;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(fallback: Locale): Locale {
  if (typeof window === "undefined") return fallback;
  try {
    return parseLocale(localStorage.getItem(LOCALE_STORAGE_KEY) ?? fallback);
  } catch {
    return fallback;
  }
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    readStoredLocale(initialLocale)
  );

  const applyLocale = useCallback((next: Locale) => {
    const safe = parseLocale(next);
    setLocaleState(safe);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, safe);
    } catch {
      /* storage unavailable */
    }
    writeLocaleCookie(safe);
    if (typeof document !== "undefined") {
      document.documentElement.lang = safe;
    }
  }, []);

  useEffect(() => {
    writeLocaleCookie(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: applyLocale,
      messages: catalog(locale),
    }),
    [applyLocale, locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale requires LocaleProvider");
  }
  return ctx.locale;
}

export function useMessages(): MessageCatalog {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useMessages requires LocaleProvider");
  }
  return ctx.messages;
}

export function useSetLocale(): (locale: Locale) => void {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useSetLocale requires LocaleProvider");
  }
  return ctx.setLocale;
}