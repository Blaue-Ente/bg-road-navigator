/**
 * Windy Webcams API — optional free tier for live border camera images
 * @see https://api.windy.com/webcams/docs
 */

const WINDY_API = "https://api.windy.com/webcams/api/v3";

export interface WindyWebcamResult {
  id: string;
  title: string;
  imageUrl: string | null;
  playerUrl: string | null;
  detailUrl: string;
  distanceKm: number;
  source: "windy";
}

interface WindyWebcamItem {
  webcamId: number;
  title: string;
  images?: {
    current?: {
      preview?: string;
      thumbnail?: string;
    };
  };
  player?: {
    live?: string;
    day?: string;
  };
  urls?: {
    detail?: string;
  };
  location?: {
    latitude?: number;
    longitude?: number;
  };
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function findNearestWebcam(
  lat: number,
  lng: number,
  radiusKm = 40
): Promise<WindyWebcamResult | null> {
  const apiKey = process.env.WINDY_WEBCAMS_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `${WINDY_API}/webcams?nearby=${lat},${lng},${radiusKm}&limit=3&include=images,player,urls,location`;
    const response = await fetch(url, {
      headers: { "x-windy-api-key": apiKey },
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      console.error(`Windy Webcams API: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const webcams: WindyWebcamItem[] = data?.result?.webcams ?? data?.webcams ?? [];

    if (webcams.length === 0) return null;

    const ranked = webcams
      .map((cam) => {
        const camLat = cam.location?.latitude ?? lat;
        const camLng = cam.location?.longitude ?? lng;
        return {
          cam,
          distanceKm: haversineKm(lat, lng, camLat, camLng),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const best = ranked[0];
    const imageUrl =
      best.cam.images?.current?.preview ??
      best.cam.images?.current?.thumbnail ??
      null;

    return {
      id: String(best.cam.webcamId),
      title: best.cam.title,
      imageUrl,
      playerUrl: best.cam.player?.live ?? best.cam.player?.day ?? null,
      detailUrl: best.cam.urls?.detail ?? `https://www.windy.com/webcams/${best.cam.webcamId}`,
      distanceKm: Math.round(best.distanceKm * 10) / 10,
      source: "windy",
    };
  } catch (error) {
    console.error("Windy Webcams error:", error);
    return null;
  }
}
