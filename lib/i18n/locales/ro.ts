import { localizeCatalog } from "@/lib/i18n/localize-catalog";
import type { DeepRecord } from "@/lib/i18n/deep-record";
import { mergeMessageTrees } from "@/lib/i18n/merge-messages";
import { bg } from "./bg";
import type { Messages } from "./bg";
import roByBg from "./translations/ro-by-bg.json";
import roOverrides from "./translations/ro-overrides.json";

export const ro = mergeMessageTrees(
  localizeCatalog(bg, roByBg),
  roOverrides
) satisfies DeepRecord<Messages>;