/**
 * Border webcam resolver — Nakordoni (queues + live page) + Windy (optional images)
 */

import { BORDER_CROSSINGS } from "@/lib/constants/border-crossings";
import { getNakordoniPageUrl } from "@/lib/constants/nakordoni-checkpoints";
import { findNearestWebcam } from "@/lib/api-clients/windy-webcams";

export interface BorderWebcamData {
  crossingId: string;
  label: string;
  imageUrl: string | null;
  playerUrl: string | null;
  nakordoniUrl: string | null;
  windyUrl: string | null;
  source: "windy" | "nakordoni" | "none";
  attribution: string;
}

export async function getBorderWebcam(
  crossingId: string
): Promise<BorderWebcamData | null> {
  const crossing = BORDER_CROSSINGS.find((c) => c.id === crossingId);
  if (!crossing) return null;

  const nakordoniUrl = getNakordoniPageUrl(crossingId);
  const windy = await findNearestWebcam(
    crossing.coords.lat,
    crossing.coords.lng,
    50
  );

  if (windy?.imageUrl || windy?.playerUrl) {
    return {
      crossingId,
      label: crossing.name_bg,
      imageUrl: windy.imageUrl,
      playerUrl: windy.playerUrl,
      nakordoniUrl,
      windyUrl: windy.detailUrl,
      source: "windy",
      attribution: 'Камера: <a href="https://www.windy.com/" target="_blank" rel="noopener noreferrer">Windy.com</a>',
    };
  }

  if (nakordoniUrl) {
    return {
      crossingId,
      label: crossing.name_bg,
      imageUrl: null,
      playerUrl: null,
      nakordoniUrl,
      windyUrl: null,
      source: "nakordoni",
      attribution:
        'Опашки и камери: <a href="https://nakordoni.eu/" target="_blank" rel="noopener noreferrer">nakordoni.eu</a>',
    };
  }

  return {
    crossingId,
    label: crossing.name_bg,
    imageUrl: null,
    playerUrl: null,
    nakordoniUrl: null,
    windyUrl: null,
    source: "none",
    attribution: "",
  };
}

export async function getAllBorderWebcams(): Promise<BorderWebcamData[]> {
  const results = await Promise.all(
    BORDER_CROSSINGS.map((c) => getBorderWebcam(c.id))
  );
  return results.filter((r): r is BorderWebcamData => r !== null);
}
