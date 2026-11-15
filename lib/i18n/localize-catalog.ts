import type { DeepRecord } from "@/lib/i18n/deep-record";

type MessageTree = { [key: string]: string | MessageTree };

function isTree(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-clone a message tree, replacing each leaf using `dict[bulgarianText]`
 * when present (falls back to the Bulgarian source).
 */
export function localizeCatalog<T extends MessageTree>(
  template: T,
  dict: Record<string, string>
): DeepRecord<T> {
  const walk = (node: MessageTree): MessageTree => {
    const out: MessageTree = {};
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (typeof value === "string") {
        const hit = dict[value];
        out[key] = hit != null && hit.trim() !== "" ? hit : value;
      } else if (isTree(value)) {
        out[key] = walk(value);
      }
    }
    return out;
  };
  return walk(template) as DeepRecord<T>;
}