import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getHereIncidents,
  hereKey,
  mergeIncidents,
} from "@/lib/api-clients/here-traffic";
import { getTomTomIncidents, tomtomKey } from "@/lib/api-clients/tomtom";
import { EuropeBboxSchema } from "@/lib/server/geo-schema";

const MAX_INCIDENTS = 400;
const SEVERITY_RANK = { critical: 0, major: 1, moderate: 2, minor: 3 } as const;

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

    let tomtomError: string | null = null;
    let hereError: string | null = null;
    // Each provider answers per one-degree tile and shares those tiles between
    // drivers for a few minutes (see lib/traffic/tiles.ts), so this stays cheap.
    const [tomtom, here] = boundingBox
      ? await Promise.all([
          getTomTomIncidents(boundingBox, { onError: (message) => (tomtomError = message) }),
          getHereIncidents(boundingBox, { onError: (message) => (hereError = message) }),
        ])
      : [[], []];
    const incidents = mergeIncidents(tomtom, here)
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .slice(0, MAX_INCIDENTS);

    return NextResponse.json({
      flow: [],
      incidents,
      ...(parsed.data.debug === "1"
        ? {
            tomtom_configured: Boolean(tomtomKey()),
            tomtom_error: tomtomError,
            here_configured: Boolean(hereKey()),
            here_error: hereError,
          }
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
