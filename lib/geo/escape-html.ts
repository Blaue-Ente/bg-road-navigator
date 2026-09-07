/** Escape text before inserting into MapLibre popups or other HTML strings. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

export function isAllowedHttpsUrl(
  value: string,
  hosts: readonly string[]
): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    return hosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}
