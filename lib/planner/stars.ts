/** OSM `stars` / `stars:hotel` when it is an integer from 1 to 5. */
export function starsFromTags(
  tags: Record<string, string> | null | undefined
): number | null {
  if (!tags) return null;
  const raw = tags.stars ?? tags["stars:hotel"];
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 5) return null;
  return value;
}
