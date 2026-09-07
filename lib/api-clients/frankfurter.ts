export interface FxQuote {
  base: "EUR";
  date: string;
  rates: Record<string, number>;
  source: "frankfurter";
  disclaimer_bg: string;
}

const FRANKFURTER_URL = "https://api.frankfurter.app/latest";
const PAIRS = "BGN,USD,GBP,CHF,TRY,RON,HUF,CZK,PLN,RSD";

export async function fetchEuroRates(): Promise<FxQuote | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${FRANKFURTER_URL}?from=EUR&to=${PAIRS}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      base?: string;
      date?: string;
      rates?: Record<string, number>;
    };
    if (!payload.rates) return null;
    return {
      base: "EUR",
      date: payload.date ?? new Date().toISOString().slice(0, 10),
      rates: payload.rates,
      source: "frankfurter",
      disclaimer_bg:
        "Курс по ECB (Frankfurter) — информативен, не обменен пункт.",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
