type MessageTree = { [key: string]: string | MessageTree };

function isMessageTree(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Deep-merge locale trees; `extra` leaves override only when non-empty. */
export function mergeMessageTrees<T extends MessageTree>(
  base: T,
  extra: MessageTree
): T {
  const merged: MessageTree = { ...base };
  for (const key of Object.keys(extra)) {
    const extraVal = extra[key];
    const baseVal = base[key];
    if (typeof extraVal === "string") {
      merged[key] = extraVal.trim() ? extraVal : (baseVal ?? "");
    } else if (isMessageTree(extraVal)) {
      const fb = isMessageTree(baseVal) ? baseVal : {};
      merged[key] = mergeMessageTrees(fb, extraVal);
    }
  }
  return merged as T;
}