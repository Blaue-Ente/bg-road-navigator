import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, parseLocale, type Locale } from "@/lib/i18n/locale";

/** Resolve locale from the same cookie the client writes (`bg-road-locale`). */
export function requestLocale(request: Request | NextRequest): Locale {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return "bg";
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`));
  if (!match) return "bg";
  const value = match.slice(LOCALE_COOKIE.length + 1).split(";")[0];
  return parseLocale(decodeURIComponent(value ?? ""));
}

/** @deprecated Use `requestLocale` — kept for the plan route during migration. */
export function resolvePlanLocale(request: NextRequest): Locale {
  return requestLocale(request);
}