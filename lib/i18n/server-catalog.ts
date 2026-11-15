import { cookies } from "next/headers";
import {
  catalog,
  LOCALE_COOKIE,
  parseLocale,
  type Locale,
} from "@/lib/i18n/locale";
import type { MessageCatalog } from "@/lib/i18n/locales/bg";

export async function serverLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value);
}

export async function serverMessages(): Promise<MessageCatalog> {
  return catalog(await serverLocale());
}