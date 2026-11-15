import { PRICE_BAND_COLOR, type PriceBand } from "@/lib/fuel-prices/bands";
import { messages as m } from "@/lib/i18n";

const ITEMS: Array<{ band: PriceBand; label: string }> = [
  { band: "green", label: m.sheet.bandGreen },
  { band: "yellow", label: m.sheet.bandYellow },
  { band: "red", label: m.sheet.bandRed },
  { band: "grey", label: m.sheet.bandGrey },
];

export function FuelPriceLegend() {
  return (
    <ul
      className="mt-2 flex flex-wrap gap-x-3 gap-y-1"
      aria-label={m.sheet.fuelLegend}
    >
      {ITEMS.map((item) => (
        <li
          key={item.band}
          className="flex items-center gap-1.5 text-xs text-[var(--waze-text-secondary)]"
        >
          <span
            className="h-2.5 w-2.5 rounded-full border border-white shadow"
            style={{ background: PRICE_BAND_COLOR[item.band] }}
            aria-hidden
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
