/**
 * Indicative car waits from the Hungarian Police Hárinfó Drupal page.
 * "Nincs 15 percet meghaladó várakozás" is a ceiling, not a measured minute.
 * The value used for sorting is that ceiling.
 */

export const HATARINFO_UNDER_15_MINUTES = 15;

export interface HatarinfoDirection {
  minutes: number;
  band: "under_15" | "measured";
  raw: string;
}

export interface HatarinfoPanel {
  name: string;
  /** Hungary → Serbia (ki). */
  out: HatarinfoDirection | null;
  /** Serbia → Hungary (be). */
  in: HatarinfoDirection | null;
}

export function parseHatarinfoHtml(html: string): HatarinfoPanel[] {
  const panels = html.split(/<div class="panel panel-primary">/i).slice(1);
  const parsed: HatarinfoPanel[] = [];
  for (const panel of panels) {
    const heading = panel.split(/class="panel-body"/i)[0] ?? "";
    const span = heading.match(/<span\b[^>]*>([\s\S]*?)<\/span>/i);
    const name = cleanText(span?.[1] ?? "")
      .replace(/[\s\u2013\u2014-]+$/u, "")
      .trim();
    if (!name) continue;
    const outbound = readDirection(panel, "felől (ki)");
    const inbound = readDirection(panel, "felé (be)");
    if (!outbound && !inbound) continue;
    parsed.push({ name, out: outbound, in: inbound });
  }
  return parsed;
}

function readDirection(
  panel: string,
  label: string
): HatarinfoDirection | null {
  const marker = `Magyarország ${label}`;
  const start = panel.indexOf(marker);
  if (start < 0) return null;
  const after = panel.slice(start + marker.length);
  const next = after.search(/<div class="label"/i);
  const block = next > 0 ? after.slice(0, next) : after.slice(0, 700);
  return parseWaitBlock(block);
}

function parseWaitBlock(block: string): HatarinfoDirection | null {
  const withoutLabel = block.replace(/<div class="label">[\s\S]*?<\/div>/gi, " ");
  const szgk = withoutLabel.match(/class="szgk"[^>]*>([\s\S]*?)<\/div>/i);
  const szgkText = szgk ? cleanText(szgk[1] ?? "") : "";
  const raw = szgkText || cleanText(withoutLabel);
  if (!raw) return null;
  const folded = raw
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  if (folded.includes("nincs 15 percet meghalado")) {
    return {
      minutes: HATARINFO_UNDER_15_MINUTES,
      band: "under_15",
      raw,
    };
  }
  const clock = raw.match(/(\d+)\s*óra(?:\s*(\d+)\s*perc)?/i);
  if (clock) {
    const minutes = Number(clock[1]) * 60 + Number(clock[2] ?? 0);
    if (minutes > 0) return { minutes, band: "measured", raw };
  }
  const perc = raw.match(/(\d+)\s*perc/i);
  if (perc) return { minutes: Number(perc[1]), band: "measured", raw };
  return null;
}

function cleanText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
