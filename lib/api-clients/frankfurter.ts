export interface FxQuote {
  base: "EUR";
  date: string;
  rates: Record<string, number>;
  source: "frankfurter";
  disclaimer_bg: string;
}

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";
const PAIRS = "USD,GBP,CHF,TRY,RON,HUF,CZK,PLN";
/** Official BGN currency-board peg to EUR — not quoted by ECB/Frankfurter. */
const BGN_PER_EUR = 1.95583;

export async function fetchEuroRates(): Promise<FxQuote | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      `${FRANKFURTER_URL}?base=EUR&symbols=${PAIRS}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: 3600 },
      }
    );
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
      rates: { BGN: BGN_PER_EUR, ...payload.rates },
      source: "frankfurter",
      disclaimer_bg:
        "Курс по ECB (Frankfurter). BGN е валутен борд 1 EUR = 1.95583 BGN — информативно, не обменен пункт.",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
