import { NextResponse } from "next/server";
import {
  DatabaseUnavailableError,
  MigrationRequiredError,
  normalizeDbError,
} from "@/lib/db";
import { catalog, type Locale } from "@/lib/i18n/locale";

function apiMessages(locale: Locale) {
  return catalog(locale).api;
}

export function databaseUnavailableResponse(locale: Locale = "bg") {
  const api = apiMessages(locale);
  return NextResponse.json(
    {
      error: api.databaseUnavailable,
      code: "DATABASE_UNAVAILABLE",
      configured: false,
    },
    { status: 503 }
  );
}

export function migrationRequiredResponse(locale: Locale = "bg") {
  const api = apiMessages(locale);
  return NextResponse.json(
    {
      error: api.migrationRequired,
      code: "MIGRATION_REQUIRED",
      configured: false,
    },
    { status: 503 }
  );
}

export function authRequiredResponse(locale: Locale = "bg") {
  const api = apiMessages(locale);
  return NextResponse.json(
    { error: api.authRequired, code: "AUTH_REQUIRED" },
    { status: 401 }
  );
}

export function rateLimitedResponse(locale: Locale = "bg") {
  const api = apiMessages(locale);
  return NextResponse.json(
    { error: api.rateLimited, code: "RATE_LIMITED" },
    { status: 429 }
  );
}

export function toDbResponse(error: unknown, locale: Locale = "bg") {
  const normalized = normalizeDbError(error);
  if (normalized instanceof DatabaseUnavailableError) {
    return databaseUnavailableResponse(locale);
  }
  if (normalized instanceof MigrationRequiredError) {
    return migrationRequiredResponse(locale);
  }
  console.error(normalized);
  const api = apiMessages(locale);
  return NextResponse.json(
    { error: api.databaseError, code: "DATABASE_ERROR" },
    { status: 500 }
  );
}

export function pgCode(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: string }).code ?? "");
  }
  return "";
}