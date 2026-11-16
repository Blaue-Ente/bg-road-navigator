"use client";

import { useLocale, useMessages } from "@/components/i18n/LocaleProvider";
import { borderDisplayName } from "@/lib/constants/border-crossings";
import { pickI18nNotes, pickText } from "@/lib/i18n/localized-field";
import { formatTemplate } from "@/lib/i18n/format-template";
import type { BorderDocument } from "@/lib/constants/border-crossings";

import type { BorderStatus } from "@/types/border.types";
import { officialLinksForCrossing } from "@/lib/constants/border-official-links";
import { FavoritePlaceButton } from "@/components/favorites/FavoritePlaceButton";

interface BorderCardProps {
  border: BorderStatus;
  onComment?: () => void;
}

function needsOtherCitizensLine(countryPair: string): boolean {
  return countryPair
    .split("-")
    .map((side) => side.trim().toUpperCase())
    .some((code) => code === "TR" || code === "RS" || code === "MK");
}

export function BorderCard({ border, onComment }: BorderCardProps) {
  const m = useMessages();
  const locale = useLocale();
  const displayName = borderDisplayName(locale, {
    crossing_id: border.crossing_id,
    name_bg: border.name_bg,
    name_en: border.name_en,
    name_i18n: border.name_i18n,
  });
  const notes = pickI18nNotes(locale, {
    notes_i18n: border.notes_i18n,
    notes_bg: border.notes_bg,
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "border-green-500/40 bg-green-500/10";
      case "yellow":
        return "border-yellow-500/40 bg-yellow-500/10";
      case "orange":
        return "border-orange-500/40 bg-orange-500/10";
      case "red":
        return "border-red-500/40 bg-red-500/10";
      default:
        return "border-[var(--waze-border)] bg-[var(--waze-surface)]";
    }
  };

  const docLabels =
    border.document_codes?.map((code: BorderDocument) => m.borders.doc[code]) ??
    [];
  const showDocuments =
    docLabels.length > 0 ||
    (border.accepted_documents && border.accepted_documents.length > 0);

  return (
    <div className={`waze-panel p-4 ${getStatusColor(border.status)}`}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-[var(--waze-text)]">
          {displayName}
        </h3>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            border.status === "green"
              ? "text-[var(--waze-ok)]"
              : border.status === "yellow"
                ? "text-[var(--waze-warning)]"
                : border.status === "orange"
                  ? "text-[var(--waze-warning)]"
                  : "text-[var(--waze-danger)]"
          }`}
        >
          {border.status === "green"
            ? m.borders.msg38f8659f01
            : border.status === "yellow"
              ? m.borders.msg27d10f0144
              : border.status === "orange"
                ? m.borders.msg9541950749
                : m.borders.msgc42c66ea86}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {(
          [
            { label: m.bordersPage.msg6a2c5dc8ec, value: border.wait_time_cars },
            { label: m.borders.msgb5cd7f8be7, value: border.wait_time_trucks },
            { label: m.borders.msgb7479c0cf4, value: border.wait_time_buses },
          ] as const
        ).map((row) => (
          <span
            key={row.label}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--waze-surface-elevated)] px-2.5 py-1 text-sm ring-1 ring-[var(--waze-border)]"
          >
            <span className="text-[var(--waze-text-muted)]">{row.label}</span>
            <span className="font-semibold text-[var(--waze-text)]">
              {row.value} {m.borders.waitMinutesSuffix}
            </span>
          </span>
        ))}
      </div>

      <div className="mb-3 text-xs text-[var(--waze-text-muted)]">
        {m.borders.workingHours} {border.working_hours}
        {border.derived_heavy_wait && (
          <span>{m.borders.msg016e5a38cf}</span>
        )}
      </div>

      {showDocuments && (
        <div className="mb-2 space-y-1 text-xs text-[var(--waze-text-secondary)]">
          {docLabels.length > 0 ? (
            <p>
              {formatTemplate(m.borders.documentsEu, {
                list: docLabels.join(", "),
              })}
            </p>
          ) : (
            <p>
              {m.borders.documents} {border.accepted_documents?.join(", ")}
            </p>
          )}
          {needsOtherCitizensLine(border.country_pair) && (
            <p>{m.borders.documentsOther}</p>
          )}
        </div>
      )}
      {notes && (
        <p className="mb-3 text-xs text-[var(--waze-text-muted)]">{notes}</p>
      )}

      <OfficialBorderLinks
        crossingId={border.crossing_id}
        countryPair={border.country_pair}
      />

      <div className="flex flex-wrap items-center gap-2">
        {border.coords && (
          <FavoritePlaceButton
            label={displayName}
            category="border"
            place={{
              coords: border.coords,
              subtitle: border.country_pair,
              crossing_id: border.crossing_id,
            }}
          />
        )}
        {onComment && (
          <button
            type="button"
            onClick={onComment}
            className="rounded-full bg-[var(--waze-accent-muted)] px-3 py-1.5 text-sm text-[var(--waze-accent-text)]"
          >
            {m.borders.msg0d6ebd8e6f}
          </button>
        )}
      </div>
    </div>
  );
}

function OfficialBorderLinks({
  crossingId,
  countryPair,
}: {
  crossingId: string;
  countryPair: string;
}) {
  const locale = useLocale();
  const links = officialLinksForCrossing({
    id: crossingId,
    country_pair: countryPair,
  });
  if (links.length === 0) return null;
  return (
    <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
      {links.map((link) => (
        <a
          key={link.kind}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          data-tap={
            link.kind === "bulletin"
              ? "border-link-bulletin"
              : link.kind === "cameras"
                ? "border-link-cameras"
                : undefined
          }
          className={`block text-sm text-[var(--waze-accent-text)] underline ${
            link.kind === "bulletin" || link.kind === "cameras"
              ? "min-h-11 py-3"
              : "py-2"
          }`}
        >
          {pickText(locale, link.label)}
        </a>
      ))}
    </div>
  );
}