/**
 * Server and planner code import Bulgarian `messages` by default.
 * Client UI should use `useMessages()` from the locale provider.
 */
export type { MessageCatalog, Messages } from "./locales/bg";
export { bg, bg as messages } from "./locales/bg";
export {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  catalog,
  localeTag,
  parseLocale,
  writeLocaleCookie,
  type Locale,
} from "./locale";