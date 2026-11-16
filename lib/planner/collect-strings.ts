import { CYRILLIC } from "@/lib/i18n/catalog-test-utils";

export function collectStrings(
  value: unknown,
  options?: { skipKeys?: string[] }
): string[] {
  const skip = new Set(options?.skipKeys ?? []);
  const out: string[] = [];
  const walk = (node: unknown, key?: string) => {
    if (key && skip.has(key)) return;
    if (typeof node === "string") {
      out.push(node);
      return;
    }
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      walk(v, k);
    }
  };
  walk(value);
  return out;
}

export function stringsWithoutCyrillic(strings: string[]): string[] {
  return strings.filter((s) => CYRILLIC.test(s));
}