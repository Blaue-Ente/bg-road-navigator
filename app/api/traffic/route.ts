import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getHereIncidents,
  hereKey,
  mergeIncidents,
} from "@/lib/api-clients/here-traffic";
import {
  getTrafficFlow,
  getTrafficIncidents,
  type TrafficFlow,
  type TrafficIncident,
} from "@/lib/api-clients/tomtom";
import { cachedValue, minutesFromEnv } from "@/lib/cache/shared-cache";
import { EuropeBboxSchema } from "@/lib/server/geo-schema";

const TrafficQuerySchema = z.object({
  bbox: z.string().max(80).optional(),
  zoom: z.coerce.number().min(3).max(18).optional(),
  debug: z.enum(["0", "1"]).default("0"),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parsed = TrafficQuerySchema.safeParse({
      bbox: searchParams.get("bbox") ?? undefined,
      zoom: searchParams.get("zoom") ?? undefined,
      debug: searchParams.get("debug") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", code: "INVALID_QUERY" },
        { status: 400 }
      );
    }

    let boundingBox: { w: number; s: number; e: number; n: number } | null =
      null;
    if (parsed.data.bbox) {
      const parts = parsed.data.bbox.split(",").map(Number);
      const candidate = {
        w: parts[0],
        s: parts[1],
        e: parts[2],
        n: parts[3],
      };
      const bboxParsed = EuropeBboxSchema.safeParse(candidate);
      if (!bboxParsed.success) {
        return NextResponse.json(
          { error: "Invalid bbox", code: "INVALID_BBOX" },
          { status: 400 }
        );
      }
      boundingBox = bboxParsed.data;
    }

    interface TrafficPayload {
      flow: TrafficFlow[];
      incidents: TrafficIncident[];
      here_error: string | null;
    }
    const seconds = minutesFromEnv(process.env.TRAFFIC_CACHE_SECONDS, 90, 600);
    const round = (value: number | undefined) => (value ?? 0).toFixed(1);
    // Every driver looks at the same area, so one pair of calls serves them all
    // for a minute or two. Traffic changes fast and the providers' terms are
    // unclear about keeping it, so this stays in memory only.
    const { value: payload } = await cachedValue<TrafficPayload>({
      key: `traffic|${round(boundingBox?.w)}|${round(boundingBox?.s)}|${round(boundingBox?.e)}|${round(boundingBox?.n)}|${parsed.data.zoom ?? 0}`,
      kind: "traffic",
      ttlMs: seconds * 1000,
      persist: false,
      load: async () => {
        let hereError: string | null = null;
        const [flow, tomtom, here] = await Promise.all([
          getTrafficFlow(boundingBox),
          getTrafficIncidents(boundingBox),
          boundingBox && hereKey()
            ? getHereIncidents(boundingBox, { onError: (message) => (hereError = message) })
            : Promise.resolve([] as TrafficIncident[]),
        ]);
        return {
          flow,
          incidents: mergeIncidents(tomtom, here),
          here_error: hereError,
        };
      },
    });
    const body = payload ?? { flow: [], incidents: [], here_error: null };
    return NextResponse.json({
      flow: body.flow,
      incidents: body.incidents,
      ...(parsed.data.debug === "1"
        ? { here_configured: Boolean(hereKey()), here_error: body.here_error }
        : {}),
    });
  } catch (error) {
    console.error("Traffic API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic data", code: "TRAFFIC_FETCH_FAILED" },
      { status: 500 }
    );
  }
}
