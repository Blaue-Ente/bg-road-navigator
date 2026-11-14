import { afterEach, describe, expect, it, vi } from "vitest";
import { VALHALLA_TIMEOUT_MS } from "@/lib/api-clients/oci-geo";
import { fetchDrivingRoute } from "@/lib/api-clients/routing";

const KEY = "test-key-value";
const SOFIA = { lng: 23.3219, lat: 42.6977 };
const PLOVDIV = { lng: 24.7453, lat: 42.1354 };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("fetchDrivingRoute", () => {
  it("uses public OSRM when OCI geo is unset", async () => {
    const seen: string[] = [];
    stubFetch((url) => {
      seen.push(url);
      return json(osrmOk());
    });
    const route = await fetchDrivingRoute([SOFIA, PLOVDIV]);
    expect(route?.provider).toBe("osrm");
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain("/route/v1/driving/");
  });

  it("skips Valhalla when only one OCI variable is set", async () => {
    vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
    const seen: string[] = [];
    stubFetch((url) => {
      seen.push(url);
      return json(osrmOk());
    });
    const route = await fetchDrivingRoute([SOFIA, PLOVDIV]);
    expect(route?.provider).toBe("osrm");
    expect(seen.some((url) => url.includes("/valhalla/"))).toBe(false);
  });

  it("returns Valhalla and does not call OSRM when the server answers", async () => {
    readyEnv();
    const seen: string[] = [];
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((line) => {
      logs.push(String(line));
    });
    stubFetch((url, init) => {
      seen.push(url);
      expect(url).not.toContain(KEY);
      expect(new Headers(init?.headers).get("X-API-Key")).toBe(KEY);
      const body = JSON.parse(String(init?.body)) as { costing?: string };
      expect(body.costing).toBe("auto");
      return json(valhallaOk());
    });

    const route = await fetchDrivingRoute([SOFIA, PLOVDIV]);
    expect(route?.provider).toBe("valhalla");
    expect(route?.distance_km).toBe(142);
    expect(route?.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(seen).toHaveLength(1);
    expect(logs.join("\n")).toContain("provider=valhalla");
    expect(logs.join("\n")).not.toContain(KEY);
  });

  it.each([
    ["unauthorized", 401],
    ["server", 500],
    ["client", 400],
  ] as const)("falls back to OSRM on Valhalla %s", async (_label, status) => {
    readyEnv();
    const seen: string[] = [];
    stubFetch((url) => {
      seen.push(url);
      if (url.includes("/valhalla/")) {
        return new Response(JSON.stringify({ error: KEY }), { status });
      }
      return json(osrmOk());
    });
    const logs: string[] = [];
    vi.spyOn(console, "info").mockImplementation((line) => {
      logs.push(String(line));
    });

    const route = await fetchDrivingRoute([SOFIA, PLOVDIV]);
    expect(route?.provider).toBe("osrm");
    expect(seen.some((url) => url.includes("/route/v1/driving/"))).toBe(true);
    expect(logs.join("\n")).toContain("fallback=osrm");
    expect(logs.join("\n")).not.toContain(KEY);
  });

  it("falls back to OSRM on a network error", async () => {
    readyEnv();
    stubFetch((url) => {
      if (url.includes("/valhalla/")) throw new TypeError("socket hang up");
      return json(osrmOk());
    });
    expect((await fetchDrivingRoute([SOFIA, PLOVDIV]))?.provider).toBe("osrm");
  });

  it("aborts a hung Valhalla request and uses OSRM", async () => {
    readyEnv();
    vi.useFakeTimers();
    vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/valhalla/")) {
        return new Promise((_resolve, reject) => {
          const abort = () => reject(new DOMException("aborted", "AbortError"));
          if (init?.signal?.aborted) abort();
          else init?.signal?.addEventListener("abort", abort);
        });
      }
      return json(osrmOk());
    });
    const pending = fetchDrivingRoute([SOFIA, PLOVDIV]);
    await vi.advanceTimersByTimeAsync(VALHALLA_TIMEOUT_MS);
    await expect(pending).resolves.toMatchObject({ provider: "osrm" });
  });

  it("falls back when Valhalla returns 200 without a trip", async () => {
    readyEnv();
    stubFetch((url) => {
      if (url.includes("/valhalla/")) return json({ error_code: 442 });
      return json(osrmOk());
    });
    expect((await fetchDrivingRoute([SOFIA, PLOVDIV]))?.provider).toBe("osrm");
  });
});

function readyEnv() {
  vi.stubEnv("OCI_GEO_BASE_URL", "https://geo.example");
  vi.stubEnv("OCI_GEO_API_KEY", KEY);
}

function stubFetch(
  handle: (url: string, init?: RequestInit) => Response | Promise<Response>
) {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    return handle(url, init);
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function osrmOk() {
  return {
    code: "Ok",
    routes: [
      {
        distance: 140_000,
        duration: 7_200,
        weight: 7_200,
        geometry: {
          type: "LineString",
          coordinates: [
            [SOFIA.lng, SOFIA.lat],
            [PLOVDIV.lng, PLOVDIV.lat],
          ],
        },
        legs: [
          {
            steps: [
              {
                name: "A1",
                distance: 140_000,
                duration: 7_200,
                maneuver: { type: "depart", location: [SOFIA.lng, SOFIA.lat] },
              },
            ],
          },
        ],
      },
    ],
  };
}

function valhallaOk() {
  return {
    trip: {
      status: 0,
      units: "kilometers",
      summary: { length: 142.4, time: 9_000 },
      legs: [
        {
          shape: encodePolyline(
            [
              [SOFIA.lng, SOFIA.lat],
              [PLOVDIV.lng, PLOVDIV.lat],
            ],
            6
          ),
          summary: { length: 142.4, time: 9_000 },
          maneuvers: [
            {
              type: 1,
              street_names: ["A1"],
              length: 142.4,
              time: 9_000,
              begin_shape_index: 0,
            },
          ],
        },
      ],
    },
  };
}

function encodePolyline(
  points: Array<[number, number]>,
  precision: number
): string {
  const factor = 10 ** precision;
  let lastLat = 0;
  let lastLng = 0;
  let encoded = "";
  for (const [lng, lat] of points) {
    const latInt = Math.round(lat * factor);
    const lngInt = Math.round(lng * factor);
    encoded += encodeSigned(latInt - lastLat);
    encoded += encodeSigned(lngInt - lastLng);
    lastLat = latInt;
    lastLng = lngInt;
  }
  return encoded;
}

function encodeSigned(value: number): string {
  let current = value < 0 ? ~(value << 1) : value << 1;
  let output = "";
  while (current >= 0x20) {
    output += String.fromCharCode((0x20 | (current & 0x1f)) + 63);
    current >>= 5;
  }
  output += String.fromCharCode(current + 63);
  return output;
}
