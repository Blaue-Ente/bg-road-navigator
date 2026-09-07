"use client";

import { useQuery } from "@tanstack/react-query";
import type { FxQuote } from "@/lib/api-clients/frankfurter";

const SHOW = ["BGN", "USD", "GBP", "CHF", "TRY", "RSD", "RON", "HUF"] as const;

export function FxRatesCard() {
  const { data, isError, isLoading } = useQuery({
    queryKey: ["fx-eur"],
    queryFn: async (): Promise<FxQuote> => {
      const response = await fetch("/api/fx");
      if (!response.ok) throw new Error("fx");
      return response.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <p className="text-xs text-[var(--waze-text-muted)]">
        Зареждане на курса…
      </p>
    );
  }
  if (isError || !data) {
    return (
      <p className="text-xs text-[var(--waze-text-muted)]">
        Курсът не е наличен в момента.
      </p>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--waze-text)]">
        Курс (1 EUR, {data.date})
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {SHOW.filter((code) => data.rates[code] != null).map((code) => (
          <div
            key={code}
            className="rounded-xl bg-[var(--waze-surface-elevated)] px-3 py-2"
          >
            <span className="text-[var(--waze-text-muted)]">{code}</span>
            <div className="font-semibold">{data.rates[code]!.toFixed(3)}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-[var(--waze-text-muted)]">
        {data.disclaimer_bg}
      </p>
    </div>
  );
}
