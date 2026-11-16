"use client";

import { useMessages } from "@/components/i18n/LocaleProvider";

import { useEffect, useState } from "react";
import type { BorderWebcamFeed } from "@/types/border.types";
import { isAllowedHttpsUrl, stripHtml } from "@/lib/geo/escape-html";
import { Camera } from "lucide-react";

const WINDY_HOSTS = ["webcams.windy.com", "windy.com"] as const;

interface BorderWebcamProps {
  crossingId: string;
  label: string;
  nakordoniUrl?: string;
}

export function BorderWebcam({
  crossingId,
  label,
  nakordoniUrl,
}: BorderWebcamProps) {
  const m = useMessages();
  const [feed, setFeed] = useState<BorderWebcamFeed | null>(null);
  const [error, setError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/borders/webcam?crossing_id=${encodeURIComponent(crossingId)}`
        );
        if (!response.ok) throw new Error("webcam fetch failed");
        const data = (await response.json()) as BorderWebcamFeed;
        if (!cancelled) setFeed(data);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [crossingId]);

  useEffect(() => {
    if (!feed?.image_url) return;
    const timer = setInterval(() => setImageKey((k) => k + 1), 600_000);
    return () => clearInterval(timer);
  }, [feed?.image_url]);

  const livePageUrl = feed?.nakordoni_url ?? nakordoniUrl ?? null;
  const playerUrl =
    feed?.player_url && isAllowedHttpsUrl(feed.player_url, WINDY_HOSTS)
      ? feed.player_url
      : null;
  const imageUrl = feed?.image_url
    ? `${feed.image_url}${feed.image_url.includes("?") ? "&" : "?"}t=${imageKey}`
    : null;

  if (playerUrl) {
    return (
      <div className="overflow-hidden rounded-lg border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)]">
        <iframe
          src={playerUrl}
          title={`Камера ${label}`}
          className="h-48 w-full border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        <WebcamFooter label={label} feed={feed} livePageUrl={livePageUrl} />
      </div>
    );
  }

  if (imageUrl && !error) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)]">
        {/* Dynamic Windy snapshot URLs; next/image remotePatterns cannot cover cache-busting query strings. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Камера ${label}`}
          className="h-48 w-full object-cover"
          onError={() => setError(true)}
        />
        <WebcamFooter label={label} feed={feed} livePageUrl={livePageUrl} />
      </div>
    );
  }

  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-[var(--waze-border)] bg-[var(--waze-surface-elevated)] p-4 text-center">
      <Camera
        className="h-8 w-8 text-[var(--waze-text-muted)]"
        strokeWidth={2}
        aria-hidden
      />
      <p className="text-sm text-[var(--waze-text)]">Жива камера — {label}</p>
      {livePageUrl ? (
        <a
          href={livePageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >{m.borders.msga9c0e3df40}</a>
      ) : (
        <p className="text-xs text-[var(--waze-text-secondary)]">{m.borders.msg9989398777}</p>
      )}
      {feed?.attribution && (
        <p className="text-[10px] text-[var(--waze-text-secondary)]">
          {stripHtml(feed.attribution)}
        </p>
      )}
    </div>
  );
}

function WebcamFooter({
  label,
  feed,
  livePageUrl,
}: {
  label: string;
  feed: BorderWebcamFeed | null;
  livePageUrl: string | null;
}) {
  const m = useMessages();
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-900/90 px-3 py-2 text-xs">
      <span className="text-white">{label}</span>
      <div className="flex items-center gap-2">
        {livePageUrl && (
          <a
            href={livePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-blue-200 hover:text-blue-100"
          >{m.borders.msg4ad10631ba}</a>
        )}
        {feed?.windy_url && (
          <a
            href={feed.windy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-blue-200 hover:text-blue-100"
          >{m.borders.msga71a775fd9}</a>
        )}
      </div>
    </div>
  );
}
