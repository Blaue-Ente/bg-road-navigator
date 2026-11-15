import { localizeCatalog } from "@/lib/i18n/localize-catalog";
import type { DeepRecord } from "@/lib/i18n/deep-record";
import { bg } from "./bg";
import type { Messages } from "./bg";
import enByBg from "./translations/en-by-bg.json";

export const en = localizeCatalog(bg, enByBg) satisfies DeepRecord<Messages>;