import { NextResponse } from "next/server";
import {
  DatabaseUnavailableError,
  MigrationRequiredError,
  normalizeDbError,
} from "@/lib/db";

export function databaseUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Базата не е включена",
      code: "DATABASE_UNAVAILABLE",
      configured: false,
    },
    { status: 503 }
  );
}

export function migrationRequiredResponse() {
  return NextResponse.json(
    {
      error: "Миграцията още не е приложена",
      code: "MIGRATION_REQUIRED",
      configured: false,
    },
    { status: 503 }
  );
}

export function authRequiredResponse() {
  return NextResponse.json(
    { error: "Нужен е вход", code: "AUTH_REQUIRED" },
    { status: 401 }
  );
}

export function rateLimitedResponse() {
  return NextResponse.json(
    { error: "Твърде много заявки. Опитайте след минута.", code: "RATE_LIMITED" },
    { status: 429 }
  );
}

export function toDbResponse(error: unknown) {
  const normalized = normalizeDbError(error);
  if (normalized instanceof DatabaseUnavailableError) {
    return databaseUnavailableResponse();
  }
  if (normalized instanceof MigrationRequiredError) {
    return migrationRequiredResponse();
  }
  console.error(normalized);
  return NextResponse.json(
    { error: "Записът не мина", code: "DATABASE_ERROR" },
    { status: 500 }
  );
}

export function pgCode(error: unknown): string {
  if (typeof error === "object" && error && "code" in error) {
    return String((error as { code?: string }).code ?? "");
  }
  return "";
}
