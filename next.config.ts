import type { NextConfig } from "next";
import { withPWA } from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "maps.googleapis.com",
      "lh3.googleusercontent.com",
      "via.placeholder.com"
    ],
  },
  // Enable only in production
  ...(isProd && {
    // Production-only settings
  }),
};

export default withPWA({
  dest: "public",
  disable: !isProd,
  register: true,
  scope: "/",
  sw: "service-worker.js",
})(nextConfig);