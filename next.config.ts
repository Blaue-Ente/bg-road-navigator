import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./lib/server/security-headers";

/**
 * The traffic-flow tiles are fetched by the browser, so their key ends up in the
 * page whatever it is called. Accept the plain name too, then expose it under the
 * NEXT_PUBLIC_ one the client code reads. Keep this key domain-restricted at TomTom.
 */
const tilesKey = (
  process.env.NEXT_PUBLIC_TOMTOM_TILES_KEY ||
  process.env.NEXT_TOMTOM_TILES_KEY ||
  ""
).trim();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: tilesKey ? { NEXT_PUBLIC_TOMTOM_TILES_KEY: tilesKey } : {},
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "maps.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.windy.com" },
      { protocol: "https", hostname: "webcams.windy.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
