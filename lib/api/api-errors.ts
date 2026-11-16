import { NextResponse } from "next/server";
import { catalog } from "@/lib/i18n/locale";
import { requestLocale } from "@/lib/i18n/request-locale";

export type ApiMessageKey = keyof ReturnType<typeof catalog>["api"];

export function apiError(
  request: Request,
  key: ApiMessageKey,
  code: string,
  status: number
) {
  const locale = requestLocale(request);
  return NextResponse.json(
    { error: catalog(locale).api[key], code },
    { status }
  );
}