"use client";

import { useEffect, useState } from "react";
import type { BorderWebcamFeed } from "@/types/border.types";

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
  const playerUrl = feed?.player_url;
  const imageUrl = feed?.image_url
    ? `${feed.image_url}${feed.image_url.includes("?") ? "&" : "?"}t=${imageKey}`
    : null;

  if (playerUrl) {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
        <iframe
          src={playerUrl}
          title={`Камера ${label}`}
          className="h-48 w-full border-0"
          loading="lazy"
          allow="autoplay; fullscreen"
        />
        <WebcamFooter label={label} feed={feed} livePageUrl={livePageUrl} />
      </div>
    );
  }

  if (imageUrl && !error) {
    return (
      <div className="relative overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
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
    <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 text-center">
      <span className="text-3xl">📷</span>
      <p className="text-sm text-gray-300">Жива камера — {label}</p>
      {livePageUrl ? (
        <a
          href={livePageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Виж на живо (Nakordoni)
        </a>
      ) : (
        <p className="text-xs text-gray-500">Няма налична камера за този пункт</p>
      )}
      {feed?.attribution && (
        <p
          className="text-[10px] text-gray-500"
          dangerouslySetInnerHTML={{ __html: feed.attribution }}
        />
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
  return (
    <div className="flex items-center justify-between gap-2 bg-gray-900/90 px-3 py-2 text-xs">
      <span className="text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        {livePageUrl && (
          <a
            href={livePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            Nakordoni
          </a>
        )}
        {feed?.windy_url && (
          <a
            href={feed.windy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            Windy
          </a>
        )}
      </div>
    </div>
  );
}
