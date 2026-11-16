import { localizeCatalog } from "@/lib/i18n/localize-catalog";
import type { DeepRecord } from "@/lib/i18n/deep-record";
import { mergeMessageTrees } from "@/lib/i18n/merge-messages";
import { bg } from "./bg";
import type { Messages } from "./bg";
import trByBg from "./translations/tr-by-bg.json";
import trOverrides from "./translations/tr-overrides.json";

export const tr = mergeMessageTrees(
  localizeCatalog(bg, trByBg),
  trOverrides
) satisfies DeepRecord<Messages>;