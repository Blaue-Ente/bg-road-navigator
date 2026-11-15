import { localizeCatalog } from "@/lib/i18n/localize-catalog";
import type { DeepRecord } from "@/lib/i18n/deep-record";
import { bg } from "./bg";
import type { Messages } from "./bg";
import trByBg from "./translations/tr-by-bg.json";

export const tr = localizeCatalog(bg, trByBg) satisfies DeepRecord<Messages>;