"use client";

import { Clock, Phone } from "lucide-react";
import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { FavoritePlaceButton } from "@/components/favorites/FavoritePlaceButton";
import { NavigateButtons } from "@/components/ui/NavigateButtons";
import { formatTemplate } from "@/lib/i18n/format-template";
import { localeTag } from "@/lib/i18n/locale";
import type { FuelStation } from "@/types/fuel.types";

interface FuelStationCardProps {
  station: FuelStation;
  onSelect?: (station: FuelStation) => void;
}

const SOURCE_LABEL = {
  tankerkoenig: "Tankerk\u00f6nig",
  "e-control": "E-Control",
  nakordoni: "Nakordoni",
} as const;

export function FuelStationCard({ station, onSelect }: FuelStationCardProps) {
  const m = useMessages();
  const locale = useLocale();
  const status =
    station.open === true
      ? {
          label: m.fuel.msgd723e45001,
          style: "bg-emerald-500/15 text-[var(--waze-ok)]",
        }
      : station.open === false
        ? {
            label: m.fuel.msg7590702c01,
            style: "bg-red-500/15 text-[var(--waze-danger)]",
          }
        : null;
  const prices = [
    {
      key: "diesel",
      label: m.fuel.msga5ed481eca,
      value: station.prices.diesel,
    },
    {
      key: "petrol95",
      label: m.fuel.msg84992a8437,
      value: station.prices.petrol95,
    },
    { key: "lpg", label: m.fuel.msg5d1111cb05, value: station.prices.lpg },
  ].filter((row) => row.value != null);
  const typeLabels = {
    diesel: m.fuel.typeDiesel,
    petrol95: m.fuel.typePetrol95,
    petrol98: m.fuel.typePetrol98,
    lpg: m.fuel.typeLpg,
    cng: m.fuel.typeCng,
    adblue: m.fuel.typeAdblue,
    e85: m.fuel.typeE85,
    hvo: m.fuel.typeHvo,
  } as const;
  const showName = station.name && station.name !== station.brand;
  const priced = new Set(prices.map((row) => row.key));
  const unpricedTypes = (station.fuel_types ?? []).filter(
    (code) => !priced.has(code)
  );
  const observed = station.price_observed_at
    ? new Date(station.price_observed_at).toLocaleTimeString(
        localeTag(locale),
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : null;

  return (
    <div
      className="waze-panel space-y-3 p-4"
      onClick={() => onSelect?.(station)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-[var(--waze-text)]">
            {station.brand}
          </h3>
          {showName ? (
            <p className="text-sm text-[var(--waze-text-secondary)]">
              {station.name}
            </p>
          ) : null}
        </div>
        {status ? (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.style}`}
          >
            {status.label}
          </span>
        ) : null}
      </div>

      {station.address ? (
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {station.address}
        </p>
      ) : null}

      {prices.length > 0 ? (
        <div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            {prices.map((row) => (
              <div
                key={row.key}
                className="rounded-xl bg-[var(--waze-surface-elevated)] p-2"
              >
                <span className="text-xs text-[var(--waze-text-secondary)]">
                  {row.label}
                </span>
                <div className="font-semibold text-[var(--waze-text)]">
                  {row.value!.toFixed(2)} {m.fuel.eurSuffix}
                </div>
              </div>
            ))}
          </div>
          {station.price_source ? (
            <p className="mt-1 text-xs text-[var(--waze-text-secondary)]">
              {formatTemplate(m.fuel.priceFrom, {
                source: SOURCE_LABEL[station.price_source],
                time: observed ?? "",
              }).replace(/,\s*$/, "")}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--waze-text-secondary)]">
          {m.fuel.noPrices}
        </p>
      )}

      {unpricedTypes.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {unpricedTypes.map((code) => (
            <span
              key={code}
              className="rounded-full bg-[var(--waze-accent-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--waze-accent-text)]"
            >
              {typeLabels[code]}
            </span>
          ))}
        </div>
      ) : null}

      {station.opening_hours ? (
        <p className="flex items-start gap-1.5 text-sm text-[var(--waze-text-secondary)]">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {station.opening_hours}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--waze-text)]">
          {station.distance_km.toFixed(1)} {m.units.km}
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-[var(--waze-text-secondary)]">
          {station.phone ? (
            <a
              href={`tel:${station.phone.replace(/[^+\d]/g, "")}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex min-h-11 items-center gap-1 text-[var(--waze-accent-text)] underline"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {m.fuel.call}
            </a>
          ) : null}
          <FavoritePlaceButton
            label={`${station.brand} ${station.name}`.trim()}
            category="fuel"
            place={{
              coords: station.coords,
              address: station.address,
              brand: station.brand,
              external_id: station.id,
            }}
          />
          {station.payment_methods.map((method) => (
            <span
              key={method}
              className="rounded-full bg-[var(--waze-surface-elevated)] px-2 py-0.5"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      <NavigateButtons point={station.coords} />
    </div>
  );
}
