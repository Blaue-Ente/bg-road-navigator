import { localizeCatalog } from "@/lib/i18n/localize-catalog";
import type { DeepRecord } from "@/lib/i18n/deep-record";
import { mergeMessageTrees } from "@/lib/i18n/merge-messages";
import { bg } from "./bg";
import type { Messages } from "./bg";
import enByBg from "./translations/en-by-bg.json";
import enOverrides from "./translations/en-overrides.json";

export const en = mergeMessageTrees(
  localizeCatalog(bg, enByBg),
  enOverrides
) satisfies DeepRecord<Messages>;