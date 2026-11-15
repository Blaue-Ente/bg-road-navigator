import { localizeCatalog } from "@/lib/i18n/localize-catalog";
import type { DeepRecord } from "@/lib/i18n/deep-record";
import { bg } from "./bg";
import type { Messages } from "./bg";
import roByBg from "./translations/ro-by-bg.json";

export const ro = localizeCatalog(bg, roByBg) satisfies DeepRecord<Messages>;