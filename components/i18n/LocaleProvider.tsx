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
import { notifyLocaleOfferChanged } from "@/lib/i18n/locale-offer-store";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: MessageCatalog;
  /** True when `bg-road-locale` exists in localStorage (explicit visitor choice). */
  hasStoredLocaleChoice: boolean;
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

export function readHasStoredLocaleChoice(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LOCALE_STORAGE_KEY) !== null;
  } catch {
    return false;
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
  const [hasStoredLocaleChoice, setHasStoredLocaleChoice] = useState(() =>
    readHasStoredLocaleChoice()
  );

  const applyLocale = useCallback((next: Locale) => {
    const safe = parseLocale(next);
    setLocaleState(safe);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, safe);
      setHasStoredLocaleChoice(true);
    } catch {
      /* storage unavailable */
    }
    notifyLocaleOfferChanged();
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
      hasStoredLocaleChoice,
    }),
    [applyLocale, hasStoredLocaleChoice, locale]
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

export function useHasStoredLocaleChoice(): boolean {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useHasStoredLocaleChoice requires LocaleProvider");
  }
  return ctx.hasStoredLocaleChoice;
}